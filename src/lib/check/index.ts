import "server-only";
import { CheckError } from "../ai";
import { reportCount } from "../reports";
import { VERDICT_RANK, type CheckResult, type Indicator, type Lang, type Signal, type Verdict } from "../types";
import { aiForMessage } from "./ai-verdict";
import { checkApp, parsePlayUrl } from "./app";
import { checkLink, mergeVerdicts, sortSignals } from "./link";
import { checkPhone, findPhones, looksLikePhone, normalizePhone, phoneIndicator } from "./phone";
import { TX } from "./texts";

export interface CheckInput {
  text?: string;
  image?: { mime: string; data: string } | null;
}

const URL_RE =
  /\bhttps?:\/\/[^\s<>"'«»]+|\bwww\.[^\s<>"'«»]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:kg|kz|ru|uz|com|net|org|top|xyz|online|site|info|me|app|io|store|shop|live|click|link|pro|biz|cc|ws|icu|vip|club|world|space|fun|website|ly|su|gd|gl|co)\b(?:\/[^\s<>"'«»]*)?/gi;

export function findUrls(text: string): string[] {
  const found = (text.match(URL_RE) ?? []).map((u) => u.replace(/[).,;:!?»"']+$/, ""));
  // Drop e-mail domains ("ivan@mail.ru" → "mail.ru").
  const filtered = found.filter((u) => {
    const i = text.indexOf(u);
    return i <= 0 || text[i - 1] !== "@";
  });
  return [...new Set(filtered)].slice(0, 5);
}

/** A single bare link, possibly without https:// ("mbank-bonus.top/login"). */
function singleUrl(text: string): string | null {
  const s = text.trim();
  if (/\s/.test(s)) return null;
  const urls = findUrls(s);
  return urls.length === 1 && urls[0].length >= s.length - 2 ? urls[0] : null;
}

/** Routes whatever the user pasted to the right check. */
export async function runCheck(input: CheckInput, lang: Lang): Promise<CheckResult> {
  const text = (input.text ?? "").trim();
  if (!input.image) {
    if (!text) throw new CheckError("empty", 400);
    if (looksLikePhone(text)) return checkPhone(text, lang);
    const url = singleUrl(text);
    if (url) {
      const appId = parsePlayUrl(url);
      return appId ? checkApp(appId, lang) : checkLink(url, lang);
    }
  }
  return checkMessage(text, input.image ?? null, lang);
}

async function checkMessage(text: string, image: { mime: string; data: string } | null, lang: Lang): Promise<CheckResult> {
  const t = TX[lang];
  const textUrls = findUrls(text);
  const linkChecks = new Map<string, Promise<CheckResult | null>>();
  const startLink = (u: string) => {
    if (linkChecks.size >= 2 || linkChecks.has(u)) return;
    const appId = parsePlayUrl(u);
    linkChecks.set(
      u,
      (appId ? checkApp(appId, lang, 15_000) : checkLink(u, lang, { ai: false })).catch(() => null),
    );
  };
  textUrls.forEach(startLink);

  let ai: Awaited<ReturnType<typeof aiForMessage>> | null = null;
  let aiError: unknown = null;
  try {
    ai = await aiForMessage(text, image, lang, 30_000);
  } catch (e) {
    aiError = e;
  }
  // Links the AI read off a screenshot.
  ai?.urls.forEach((u) => {
    if (!/^https?:\/\//i.test(u) && !/^[\w-]+(\.[\w-]+)+/.test(u)) return;
    startLink(u.replace(/\s/g, ""));
  });
  const links = (await Promise.all(linkChecks.values())).filter((r): r is CheckResult => Boolean(r));

  if (!ai && !links.length) throw aiError instanceof CheckError ? aiError : new CheckError("ai_failed", 502);

  const phones = [...new Set([...findPhones(text), ...(ai?.phones.map(normalizePhone).filter((p): p is string => Boolean(p)) ?? [])])].slice(0, 3);
  const phoneIndicators = phones.map(phoneIndicator);
  const phoneCounts = await Promise.all(phoneIndicators.map((i) => reportCount([i])));

  const signals: Signal[] = [...(ai?.signals ?? [])];
  for (const l of links) {
    if (l.verdict !== "safe") signals.push({ level: l.verdict === "danger" ? "bad" : l.verdict === "suspicious" ? "warn" : "info", text: t.linkInMessage(l.subject, l.verdict) });
  }
  phoneIndicators.forEach((p, i) => {
    if (phoneCounts[i] > 0) signals.push({ level: phoneCounts[i] >= 3 ? "bad" : "warn", text: t.phoneInMessage(p.display, phoneCounts[i]) });
  });

  const risky: Verdict[] = links.map((l) => l.verdict).filter((v) => v === "danger" || v === "suspicious");
  if (phoneCounts.some((c) => c >= 3)) risky.push("danger");
  else if (phoneCounts.some((c) => c > 0)) risky.push("suspicious");
  const base: Verdict = ai?.verdict ?? "unknown";
  const verdict = mergeVerdicts([base, ...risky]);
  const aiMatches = ai && ai.verdict === verdict;

  const indicators: Indicator[] = [...links.flatMap((l) => l.indicators), ...phoneIndicators];
  return {
    kind: "message",
    verdict,
    title: (aiMatches ? ai!.title : "") || t.titles[verdict],
    summary: (ai && (aiMatches || VERDICT_RANK[ai.verdict] >= VERDICT_RANK.suspicious) ? ai.summary : "") || t.summaries[verdict],
    subject: image ? t.subject.screenshot : t.subject.message,
    scheme: verdict === "safe" ? null : (ai?.scheme ?? links.find((l) => l.scheme)?.scheme ?? null),
    signals: sortSignals(signals),
    advice: (aiMatches && ai!.advice.length ? ai!.advice : t.advice[verdict]),
    facts: [],
    indicators,
    reports: phoneCounts.reduce((a, b) => a + b, 0) + links.reduce((a, l) => a + l.reports, 0),
    links,
    lang,
    aiSkipped: !ai,
  };
}
