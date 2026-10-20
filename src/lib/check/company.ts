import "server-only";
import { CheckError } from "../ai";
import type { CheckResult, Fact, Lang, Signal, Verdict } from "../types";
import { aiForCompany } from "./ai-verdict";
import { checkApp, parsePlayUrl } from "./app";
import { findUrls } from "./urls";
import { checkLink, isRestated, mergeVerdicts, sortSignals } from "./link";
import { BRANDS, brandMentioned, deobfuscate, type Brand } from "./official";
import { TX } from "./texts";

/*
 * "Can I trust this company?" Kalkan cannot query government registries, so it never says a company is
 * registered or licensed. It looks for the red flags of pyramids and fake companies in what the user wrote,
 * checks any website they pasted, and always explains where to verify officially.
 */

type FlagId = keyof (typeof TX)["ru"]["company"]["flags"];

/** Red flags that do not need the AI (Russian and Kyrgyz wording). Each one is a fact found in the text. */
const FLAGS: { id: FlagId; level: "bad" | "warn"; re: RegExp }[] = [
  { id: "guaranteed", level: "bad", re: /гарантир\p{L}*\s+(?:\p{L}+\s+){0,2}(?:доход|прибыл|выплат|процент)|без\s+риска|кепилденген/iu },
  {
    id: "highReturn",
    level: "bad",
    re: /\d+(?:[.,]\d+)?\s*%\s*(?:в|за|каждый|в\s+каждый)?\s*(?:день|сутки|недел|месяц|ежеднев|еженедел|ежемесяч|күнүнө|жумасына|айына)|(?:ежеднев\p{L}*|еженедел\p{L}*|ежемесяч\p{L}*|в\s+(?:день|неделю|месяц)|күнүнө|жумасына|айына)\s+(?:до\s+|по\s+)?\d+(?:[.,]\d+)?\s*%|(?:удво|утро)\p{L}*\s+(?:вклад|деньг|сумм)/iu,
  },
  { id: "referral", level: "bad", re: /приглас\p{L}*\s+(?:друз|знаком|люд)|за\s+каждого\s+(?:приглаш|приведен|нового)|приведи\s+друга|рефера|бонус\s+за\s+друз|досторду\s+чакыр/iu },
  { id: "card", level: "bad", re: /(?:на|перев\p{L}*\s+на)\s+(?:личн\p{L}*\s+)?карт\p{L}*|на\s+(?:номер\s+)?(?:элсом|о!?\s*деньги|mbank|мбанк)|картага\s+которуу/iu },
  { id: "prepay", level: "bad", re: /(?:оплат\p{L}*|внес\p{L}*|взнос)\s+(?:за\s+)?(?:обучени|регистраци|оформлени|страховк|комисси)|вступительн\p{L}*\s+взнос|предоплат/iu },
  { id: "crypto", level: "warn", re: /крипт|usdt|биткоин|bitcoin|\bbtc\b|трейдинг|торгов\p{L}*\s+бот|арбитраж|бинанс|binance/iu },
  { id: "passive", level: "warn", re: /пассивн\p{L}*\s+доход|доход\s+без\s+(?:работ|усили|вложени)|легк\p{L}*\s+деньг|быстр\p{L}*\s+(?:заработ|деньг)/iu },
  { id: "messengerOnly", level: "warn", re: /только\s+(?:в|через)\s+(?:telegram|телеграм|whatsapp|ватсап|instagram|инстаграм)|пиши\s+в\s+(?:лс|директ|личку)/iu },
];

/** A Kyrgyz INN has 14 digits. */
const INN_RE = /(?<!\d)\d{10,16}(?!\d)/;

/** Messengers and social networks are where people talk, not companies they would pay. */
const NOT_A_COMPANY = new Set(["Telegram", "WhatsApp", "Instagram", "Facebook"]);

function knownBrand(text: string): Brand | null {
  const named = brandMentioned(text);
  if (named && !NOT_A_COMPANY.has(named.name)) return named;
  const lower = text.toLowerCase();
  const flat = deobfuscate(text);
  return (
    BRANDS.find(
      (b) =>
        !NOT_A_COMPANY.has(b.name) &&
        ((b.name.length >= 4 && lower.includes(b.name.toLowerCase())) ||
          b.keywords.some((k) => k.length >= 5 && flat.includes(deobfuscate(k)))),
    ) ?? null
  );
}

/** What to show as "checked": the name the AI picked out, else the start of what the user wrote. */
function subjectFrom(text: string, aiName: string, fallback: string): string {
  if (aiName) return aiName;
  const firstLine = text.split(/\n/)[0].trim();
  if (!firstLine) return fallback;
  // "Golden Profit KG — обещают 30%…" → "Golden Profit KG"
  const head = firstLine.split(/\s[—–-]\s|[,.:;!?(]/)[0].trim();
  if (head.length >= 2 && head.length <= 48) return head;
  return firstLine.length <= 48 ? firstLine : `${firstLine.slice(0, 47)}…`;
}

export async function checkCompany(raw: string, lang: Lang): Promise<CheckResult> {
  const t = TX[lang];
  const tc = t.company;
  const text = raw.trim();
  if (!text) throw new CheckError("empty", 400);

  const signals: Signal[] = [];
  const facts: Fact[] = [];

  // 1. Red flags in the description.
  const found = FLAGS.filter((f) => f.re.test(text));
  for (const f of found) signals.push({ level: f.level, text: tc.flags[f.id] });

  // 2. Tax number.
  const inn = text.match(INN_RE)?.[0];
  if (inn) {
    facts.push({ label: tc.f.inn, value: inn });
    if (inn.length !== 14) signals.push({ level: "warn", text: tc.innLength(inn.length) });
  }

  // 3. A big known organisation: the main risk is a fake that uses its name.
  const brand = knownBrand(text);
  if (brand) {
    signals.push({ level: "info", text: tc.brand(brand.name, brand.domains[0]) });
    facts.push({ label: tc.f.officialSite, value: brand.domains.join(", ") });
  }

  // 4. Websites and app links the user pasted: checked like any link.
  const urls = findUrls(text).slice(0, 2);
  const links = (
    await Promise.all(
      urls.map((u) => {
        const appId = parsePlayUrl(u);
        return (appId ? checkApp(appId, lang, 15_000) : checkLink(u, lang, { ai: false })).catch(() => null);
      }),
    )
  ).filter((r): r is CheckResult => Boolean(r));
  for (const l of links) {
    if (l.verdict !== "safe") signals.push({ level: l.verdict === "danger" ? "bad" : l.verdict === "suspicious" ? "warn" : "info", text: t.linkInMessage(l.subject, l.verdict) });
    else signals.push({ level: "good", text: t.linkInMessage(l.subject, l.verdict) });
  }

  // 5. The AI reads the description as a whole.
  let ai: Awaited<ReturnType<typeof aiForCompany>> | null = null;
  try {
    ai = await aiForCompany(
      text,
      {
        red_flags_found: found.map((f) => f.id),
        known_brand: brand ? { name: brand.name, official_domains: brand.domains } : null,
        inn: inn ?? null,
        websites: links.map((l) => ({ site: l.subject, verdict: l.verdict })),
      },
      lang,
      25_000,
    );
  } catch (e) {
    if (!(e instanceof CheckError)) console.error("[company ai]", e);
  }
  for (const s of ai?.signals ?? []) if (!isRestated(s.text, signals)) signals.push(s);

  const bad = signals.filter((s) => s.level === "bad").length;
  const warn = signals.filter((s) => s.level === "warn").length;
  const rule: Verdict = bad >= 2 ? "danger" : bad || warn ? "suspicious" : "unknown";
  // Without registry access we never call a company "safe" on our own: only when the AI sees an ordinary service.
  const verdict = ai ? mergeVerdicts([ai.verdict, rule]) : rule;
  const aiMatches = ai && ai.verdict === verdict;

  return {
    kind: "company",
    verdict,
    title: (aiMatches ? ai!.title : "") || tc.titles[verdict],
    summary: (aiMatches ? ai!.summary : "") || tc.summaries[verdict],
    subject: subjectFrom(text, ai?.name ?? "", tc.subject),
    scheme: verdict === "safe" ? null : (ai?.scheme ?? (found.some((f) => f.id === "referral" || f.id === "highReturn") ? "investment" : null)),
    signals: sortSignals(signals),
    advice: aiMatches && ai!.advice.length ? ai!.advice : tc.advice[verdict],
    facts,
    indicators: links.flatMap((l) => l.indicators),
    reports: links.reduce((a, l) => a + l.reports, 0),
    links,
    lang,
    aiSkipped: !ai,
    verify: tc.verify,
  };
}
