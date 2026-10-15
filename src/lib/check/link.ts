import "server-only";
import { domainToUnicode } from "node:url";
import * as cheerio from "cheerio";
import { parse as parseDomain } from "tldts";
import { CheckError } from "../ai";
import { reportCount } from "../reports";
import { VERDICT_RANK, type CheckResult, type Fact, type Indicator, type Lang, type SchemeId, type Signal, type Verdict } from "../types";
import { aiForLink } from "./ai-verdict";
import { domainAge } from "./domain-age";
import { checkFeeds } from "./feeds";
import { fetchPage, parseUserUrl, type FetchedPage } from "./net";
import { brandForDomain, brandMentioned, FREE_HOSTING, imitatedBrand, KNOWN_DOMAINS, RISKY_TLDS, SHORTENERS, type Brand } from "./official";
import { fmtDate, TX } from "./texts";

/** Platforms where anyone can publish: the platform is fine, the page on it may not be. */
const USER_CONTENT = new Set([
  "docs.google.com", "sites.google.com", "forms.gle", "telegra.ph", "t.me", "telegram.me", "vk.com", "ok.ru",
  "instagram.com", "facebook.com", "tiktok.com", "youtube.com", "youtu.be", "github.com", "wa.me",
]);

interface DomainInfo {
  url: URL;
  host: string;
  /** Registrable domain by the public suffix list (ICANN part): what is bought from a registrar. */
  reg: string;
  /** Includes private suffixes, so "fake-bank.vercel.app" stays itself. Used for reports and display. */
  site: string;
  unicode: string;
  tld: string;
  isIp: boolean;
  brand: Brand | null;
  gov: boolean;
  known: boolean;
  ugc: boolean;
  shortener: boolean;
  hosting: string | null;
}

function describe(url: URL): DomainInfo {
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const p = parseDomain(host);
  const priv = parseDomain(host, { allowPrivateDomains: true });
  const reg = p.domain || host;
  const brand = brandForDomain(reg) ?? brandForDomain(host);
  return {
    url,
    host,
    reg,
    site: priv.domain || host,
    unicode: domainToUnicode(host) || host,
    tld: p.publicSuffix?.split(".").pop() ?? "",
    isIp: Boolean(p.isIp),
    brand,
    gov: host === "gov.kg" || host.endsWith(".gov.kg"),
    known: KNOWN_DOMAINS.has(reg) || KNOWN_DOMAINS.has(host),
    ugc: USER_CONTENT.has(host) || USER_CONTENT.has(reg),
    shortener: SHORTENERS.has(host) || SHORTENERS.has(reg),
    hosting: FREE_HOSTING.find((h) => host === h || host.endsWith(`.${h}`)) ?? null,
  };
}

const trusted = (d: DomainInfo) => Boolean(d.brand) || d.gov;

interface PageScan {
  title: string;
  text: string;
  card: boolean;
  password: boolean;
  code: boolean;
  phone: boolean;
  voting: boolean;
  telegramName: string;
}

function scanPage(html: string): PageScan {
  const $ = cheerio.load(html);
  const title = ($("meta[property='og:title']").attr("content") || $("title").first().text() || "").trim().slice(0, 160);
  const attrs: string[] = [];
  let password = false;
  let phone = false;
  $("input, select, textarea").each((_, el) => {
    const e = $(el);
    const type = (e.attr("type") || "").toLowerCase();
    if (type === "password") password = true;
    if (type === "tel") phone = true;
    attrs.push([e.attr("name"), e.attr("id"), e.attr("placeholder"), e.attr("autocomplete"), e.attr("aria-label")].join(" ").toLowerCase());
  });
  const a = attrs.join(" | ");
  const card = /(card.?num|cardnumber|cc-?num|cc-?number|\bpan\b|cvv|cvc|cc-?exp|expir|номер карты|срок действия|карта)/i.test(a);
  const code = /(otp|one-?time|sms|смс|\bcode\b|код)/i.test(a);
  if (/(phone|телефон|tel\b|msisdn)/i.test(a)) phone = true;

  $("script, style, noscript, svg, template").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3500);
  const voting = /(голосова|проголосу|vote|voting|конкурс|добуш бер)/i.test(`${title} ${text}`);
  const telegramName = $(".tgme_page_title").text().trim()
    ? `${$(".tgme_page_title").text().trim()}${$(".tgme_page_extra").text().trim() ? ` (${$(".tgme_page_extra").text().trim()})` : ""}`
    : "";
  return { title, text, card, password, code, phone, voting, telegramName };
}

const cache = new Map<string, { at: number; r: CheckResult }>();

export async function checkLink(
  raw: string,
  lang: Lang,
  /** feeds=false: judge only by our own checks (used to measure accuracy without the phishing lists). */
  opts: { ai?: boolean; budgetMs?: number; feeds?: boolean } = {},
): Promise<CheckResult> {
  const url = parseUserUrl(raw.replace(/[).,;!?»"']+$/, ""));
  const key = `${lang}:${opts.ai === false ? "noai" : "ai"}:${opts.feeds === false ? "nofeed" : "feed"}:${url.href}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.r;

  const t = TX[lang];
  const budget = opts.budgetMs ?? 40_000;
  const started = Date.now();
  const start = describe(url);
  if (start.host === "localhost") throw new CheckError("blocked_url", 400);

  // Network work in parallel: open the page, look up the domain's age, check phishing lists.
  const [page, startAge, feedStart] = await Promise.all([
    fetchPage(url, 12_000),
    trusted(start) || start.known || start.shortener || start.isIp || start.hosting ? Promise.resolve(null) : domainAge(start.reg),
    opts.feeds === false ? Promise.resolve(null) : checkFeeds([url], (h) => describe(new URL(`https://${h}`)).known),
  ]);

  const final = page.hops.length ? describe(page.finalUrl) : start;
  const moved = final.site !== start.site;
  const [finalAge, feedFinal] = moved
    ? await Promise.all([
        trusted(final) || final.known || final.isIp || final.hosting ? Promise.resolve(null) : domainAge(final.reg),
        opts.feeds === false ? Promise.resolve(null) : checkFeeds([page.finalUrl], (h) => describe(new URL(`https://${h}`)).known),
      ])
    : [startAge, null];
  const feed = feedStart ?? feedFinal;

  const signals: Signal[] = [];
  const add = (level: Signal["level"], text: string) => {
    if (!signals.some((s) => s.text === text)) signals.push({ level, text });
  };

  if (feed) add("bad", t.feed(feed.source === "google" ? "Google Safe Browsing" : "OpenPhish"));
  if (moved) add(start.shortener ? "info" : "warn", start.shortener ? t.shortener(final.unicode) : t.redirect(final.unicode));

  const scan = page.html ? scanPage(page.html) : null;
  const sensitiveForm = Boolean(scan && (scan.card || scan.password || scan.code));

  for (const d of moved && !start.shortener ? [start, final] : [final]) {
    if (d.brand) add("good", t.official(d.brand.name));
    else if (d.gov) add("good", t.gov);
    else if (d.known) add(d.ugc ? "info" : "good", t.known(d.site));
    else {
      const imitated = imitatedBrand(d.host, d.reg, parseDomain(d.host).domainWithoutSuffix || d.reg);
      if (imitated) {
        const strong = imitated.money || sensitiveForm || Boolean(scan?.phone);
        add(strong ? "bad" : "warn", strong ? t.imitates(imitated.name, imitated.domains[0]) : t.imitatesSoft(imitated.name, imitated.domains[0]));
      }
      if (d.hosting) add("warn", t.freeHosting(d.hosting));
      if (RISKY_TLDS.has(d.tld)) add("warn", t.riskyTld(d.tld));
      if (d.host.includes("xn--")) add("warn", t.idn);
      if (d.isIp) add("warn", t.ip);
    }
  }

  const age = finalAge ?? (moved ? null : startAge);
  if (age && !trusted(final) && !final.known) {
    const days = Math.floor((Date.now() - age.created.getTime()) / 86_400_000);
    if (days < 30) add("bad", t.ageNew(Math.max(days, 0)));
    else if (days < 180) add("warn", t.ageYoung(fmtDate(age.created)));
    else if (days > 730) add("good", t.ageOld(age.created.getUTCFullYear()));
  }

  if (scan && /suspected (phishing|malware)|phishing warning|deceptive site/i.test(scan.title)) {
    add("bad", t.cfWarning);
  }
  if (scan) {
    if (!trusted(final)) {
      const mentioned = brandMentioned(`${scan.title} ${scan.text.slice(0, 1500)}`);
      if (mentioned && !mentioned.domains.includes(final.reg) && (sensitiveForm || scan.phone)) {
        add("bad", t.pageBrand(mentioned.name, mentioned.domains[0]));
      }
      if (scan.phone && scan.code) add("bad", t.askAccount);
      else {
        if (scan.card) add("warn", t.askCard);
        if (scan.password && !final.known) add("warn", t.askPassword);
        if (scan.code) add("warn", t.askCode);
      }
      if (scan.voting && (scan.phone || scan.code)) add("bad", t.voting);
    }
    if (page.finalUrl.protocol === "http:" && (sensitiveForm || scan.phone)) add("warn", t.http);
    if (scan.telegramName && /(^|\.)t\.me$|telegram\.me$/.test(final.host)) add("info", t.telegram(scan.telegramName));
  } else if (page.problem === "not_html") {
    add(/\.apk$/i.test(page.finalUrl.pathname) ? "bad" : "warn", /\.apk$/i.test(page.finalUrl.pathname) ? t.apk : t.download);
  } else if (page.problem === "dns") {
    add("warn", t.noDns);
  } else if (!page.ok) {
    add("info", t.unreachable);
  }

  const indicators: Indicator[] = [];
  for (const d of moved ? [start, final] : [start]) {
    if (!trusted(d) && !d.known && !d.shortener) indicators.push({ type: "domain", value: d.site, display: domainToUnicode(d.site) || d.site });
  }
  const reports = await reportCount(indicators);
  if (reports >= 3) add("bad", t.reportsMany(reports));
  else if (reports > 0) add("warn", t.reportsFew(reports));

  let verdict = ruleVerdict(signals, final, page, Boolean(feed));
  let scheme: SchemeId | null = signals.some((s) => s.text === t.voting || s.text === t.askAccount)
    ? "voting"
    : signals.some((s) => s.level === "bad") ? "phishing" : null;

  // AI: reads the page and explains the verdict in plain words. Never needed for the verdict to exist.
  let title = "";
  let summary = "";
  let advice: string[] = [];
  let aiSkipped = opts.ai === false;
  if (opts.ai !== false) {
    try {
      const ai = await aiForLink(
        {
          checked_link: url.href,
          final_address: moved ? page.finalUrl.href : undefined,
          redirects: page.hops.length > 1 ? page.hops.map((h) => h.url) : undefined,
          domain: final.unicode,
          official_site_of: final.brand?.name ?? (final.gov ? "Government of Kyrgyzstan" : undefined),
          well_known_platform: final.known ? final.site : undefined,
          domain_created: age ? age.created.toISOString().slice(0, 10) : "unknown",
          page_opened: page.ok,
          page_title: scan?.title,
          page_asks_for: scan ? { card: scan.card, password: scan.password, code: scan.code, phone: scan.phone } : undefined,
          page_text: scan?.text,
          technical_findings: signals.map((s) => `${s.level}: ${s.text}`),
          rule_based_verdict: verdict,
        },
        lang,
        Math.max(5_000, budget - (Date.now() - started) - 2_000),
      );
      const aiCanRaise = !trusted(final);
      let next = verdict;
      if (aiCanRaise && VERDICT_RANK[ai.verdict] > VERDICT_RANK[verdict]) next = ai.verdict;
      // Nothing alarming found by the rules, the page opened, and the AI read it as normal → safe.
      if (verdict === "unknown" && ai.verdict === "safe" && page.ok && !signals.some((s) => s.level === "warn" || s.level === "bad")) next = "safe";
      if (ai.verdict === next) {
        title = ai.title;
        summary = ai.summary;
        advice = ai.advice;
        for (const s of ai.signals.slice(0, 3)) {
          if ((s.level !== "good" || next === "safe") && !isRestated(s.text, signals)) add(s.level, s.text);
        }
        if (ai.scheme && next !== "safe") scheme = ai.scheme;
      }
      verdict = next;
    } catch (e) {
      aiSkipped = true;
      if (!(e instanceof CheckError)) console.error("[link ai]", e);
    }
  }
  if (verdict === "safe") scheme = null;

  const facts: Fact[] = [{ label: t.f.address, value: shortUrl(url) }];
  if (moved || page.hops.length > 1) facts.push({ label: t.f.final, value: shortUrl(page.finalUrl) });
  if (page.hops.length > 1) facts.push({ label: t.f.hops, value: String(page.hops.length - 1) });
  if (age) facts.push({ label: t.f.created, value: fmtDate(age.created) });
  if (age?.registrar) facts.push({ label: t.f.registrar, value: age.registrar.slice(0, 80) });
  if (scan?.title) facts.push({ label: t.f.pageTitle, value: scan.title });

  const result: CheckResult = {
    kind: "link",
    verdict,
    title: title || t.titles[verdict],
    summary: summary || t.summaries[verdict],
    subject: start.shortener && moved ? final.unicode : start.unicode,
    scheme,
    signals: sortSignals(signals),
    advice: advice.length ? advice : t.advice[verdict],
    facts,
    indicators,
    reports,
    links: [],
    lang,
    aiSkipped,
  };
  cache.set(key, { at: Date.now(), r: result });
  if (cache.size > 2_000) cache.delete(cache.keys().next().value!);
  return result;
}

function ruleVerdict(signals: Signal[], final: DomainInfo, page: FetchedPage, feed: boolean): Verdict {
  if (feed) return "danger";
  const bad = signals.filter((s) => s.level === "bad").length;
  const warn = signals.filter((s) => s.level === "warn").length;
  const good = signals.filter((s) => s.level === "good").length;
  if (trusted(final)) return bad ? "suspicious" : "safe";
  if (bad) return "danger";
  if (final.known && !final.ugc) return warn ? "suspicious" : "safe";
  if (warn - good >= 1) return "suspicious";
  if (good > 0 && page.ok) return "safe";
  return "unknown";
}

const words = (s: string) => new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3));
/** AI signals often restate a technical one in other words: skip those. */
export function isRestated(text: string, existing: Signal[]): boolean {
  const a = words(text);
  if (!a.size) return true;
  return existing.some((e) => {
    const b = words(e.text);
    let common = 0;
    a.forEach((w) => {
      if ([...b].some((x) => x.slice(0, 5) === w.slice(0, 5))) common++;
    });
    return common / Math.min(a.size, b.size || 1) >= 0.3;
  });
}

const ORDER: Record<Signal["level"], number> = { bad: 0, warn: 1, info: 2, good: 3 };
export const sortSignals = (s: Signal[]) => [...s].sort((a, b) => ORDER[a.level] - ORDER[b.level]);

function shortUrl(u: URL): string {
  const host = domainToUnicode(u.hostname) || u.hostname;
  const rest = `${u.pathname === "/" ? "" : u.pathname}${u.search}`;
  const s = `${u.protocol === "http:" ? "http://" : ""}${host}${rest}`;
  return s.length > 90 ? `${s.slice(0, 87)}…` : s;
}

export function mergeVerdicts(list: Verdict[]): Verdict {
  return list.reduce<Verdict>((a, b) => (VERDICT_RANK[b] > VERDICT_RANK[a] ? b : a), "safe");
}
