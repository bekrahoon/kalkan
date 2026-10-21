import "server-only";
import { CheckError } from "../ai";
import { VERDICT_RANK, type CheckMode, type CheckResult, type Indicator, type Lang, type Signal, type Verdict } from "../types";
import { aiForMessage } from "./ai-verdict";
import { checkApp, parsePlayUrl } from "./app";
import { checkLink, isRestated, mergeVerdicts, sortSignals } from "./link";
import { checkPhone, looksLikePhone } from "./phone";
import { getDomain } from "tldts";
import { brandForDomain } from "./official";
import { readQr } from "./qr";
import { TX } from "./texts";
import { findUrls } from "./urls";
import { checkCompany } from "./company";
import { scamHeuristics } from "./heuristics";

export { findUrls };

export interface CheckInput {
  text?: string;
  image?: { mime: string; data: string } | null;
  /** "company": the user asked whether a company or project can be trusted. */
  mode?: CheckMode;
}

/** A single bare link, possibly without https:// ("mbank-bonus.top/login"). */
function singleUrl(text: string): string | null {
  const s = text.trim();
  if (/\s/.test(s)) return null;
  const urls = findUrls(s);
  return urls.length === 1 && urls[0].length >= s.length - 2 ? urls[0] : null;
}

/** Hard limit so the user always gets an answer before the 60 s function timeout (e.g. when the AI is overloaded). */
const DEADLINE_MS = 50_000;

/** Routes whatever the user pasted to the right check. */
export async function runCheck(input: CheckInput, lang: Lang): Promise<CheckResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new CheckError("ai_busy", 503)), DEADLINE_MS);
  });
  try {
    return await Promise.race([routeCheck(input, lang), late]);
  } finally {
    clearTimeout(timer);
  }
}

async function routeCheck(input: CheckInput, lang: Lang): Promise<CheckResult> {
  const begun = Date.now();
  const text = (input.text ?? "").trim();
  if (input.mode === "company" && !input.image) return checkCompany(text, lang);
  if (!input.image) {
    if (!text) throw new CheckError("empty", 400);
    if (looksLikePhone(text)) return checkPhone(text, lang);
    const url = singleUrl(text);
    if (url) {
      const appId = parsePlayUrl(url);
      if (appId) return checkApp(appId, lang);
      const r = await checkLink(url, lang, { budgetMs: 30_000 });
      // Invite/download links of shops and services often bounce to Google Play: judge the app itself.
      const landedApp = r.finalUrl && r.verdict !== "danger" ? parsePlayUrl(r.finalUrl) : null;
      if (landedApp) {
        const app = await checkApp(landedApp, lang, Math.max(8_000, 45_000 - (Date.now() - begun))).catch(() => null);
        if (app) {
          const t = TX[lang];
          return {
            ...app,
            signals: [{ level: "info", text: t.toPlay(r.subject) }, ...app.signals],
            facts: [{ label: t.f.address, value: r.facts[0]?.value ?? r.subject }, ...app.facts],
          };
        }
      }
      return r;
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

  // QR codes on documents and receipts: where they lead matters most, so they are checked first.
  const qr = image ? readQr(image.mime, image.data) : [];
  const qrUrls = qr.filter((q) => /^https?:\/\//i.test(q));
  qrUrls.forEach(startLink);

  let ai: Awaited<ReturnType<typeof aiForMessage>> | null = null;
  let aiError: unknown = null;
  try {
    ai = await aiForMessage(text, image, lang, 30_000, qr);
  } catch (e) {
    aiError = e;
  }
  // Links the AI read off a screenshot.
  ai?.urls.forEach((u) => {
    if (!/^https?:\/\//i.test(u) && !/^[\w-]+(\.[\w-]+)+/.test(u)) return;
    startLink(u.replace(/\s/g, ""));
  });
  const links = (await Promise.all(linkChecks.values())).filter((r): r is CheckResult => Boolean(r));

  // Plain rules as a safety net when the AI is down or unsure.
  const heur = !ai || ai.verdict === "unknown" ? scamHeuristics(text, lang) : null;
  if (!ai && !links.length && heur?.verdict === "unknown") throw aiError instanceof CheckError ? aiError : new CheckError("ai_failed", 502);



  // Technical findings first; AI findings only if they add something new.
  const signals: Signal[] = [];
  for (const q of qr) {
    if (!/^https?:\/\//i.test(q)) {
      signals.push({ level: "info", text: t.qrText(q.slice(0, 80)) });
      continue;
    }
    try {
      const host = new URL(q).hostname.toLowerCase();
      const reg = getDomain(host) ?? host;
      const official = host.endsWith(".gov.kg") || host === "gov.kg" || Boolean(brandForDomain(reg));
      signals.push({ level: official ? "good" : "warn", text: official ? t.qrOfficial(host) : t.qrOther(host) });
    } catch {
      /* not a valid URL */
    }
  }
  for (const l of links) {
    if (l.verdict !== "safe") signals.push({ level: l.verdict === "danger" ? "bad" : l.verdict === "suspicious" ? "warn" : "info", text: t.linkInMessage(l.subject, l.verdict) });
  }
  for (const s of ai?.signals ?? []) if (!isRestated(s.text, signals)) signals.push(s);
  for (const s of heur?.signals ?? []) if (!isRestated(s.text, signals)) signals.push(s);

  const risky: Verdict[] = links.map((l) => l.verdict).filter((v) => v === "danger" || v === "suspicious");
  const base: Verdict = ai && ai.verdict !== "unknown" ? ai.verdict : (heur?.verdict ?? "unknown");
  const verdict = mergeVerdicts([base, ...risky]);
  const aiMatches = ai && ai.verdict === verdict;

  const indicators: Indicator[] = links.flatMap((l) => l.indicators);
  const doc = ai?.doc.isDocument ? ai.doc : null;
  const facts = doc
    ? [
        ...(doc.type ? [{ label: t.f.docType, value: doc.type }] : []),
        ...(doc.issuer ? [{ label: t.f.issuer, value: doc.issuer }] : []),
        ...qr.map((q) => ({ label: t.f.qr, value: q.length > 90 ? `${q.slice(0, 87)}…` : q })),
      ]
    : [];
  return {
    kind: doc ? "document" : "message",
    verify: doc?.verifyHow || undefined,
    verdict,
    title: (aiMatches ? ai!.title : "") || t.titles[verdict],
    summary: (ai && (aiMatches || VERDICT_RANK[ai.verdict] >= VERDICT_RANK.suspicious) ? ai.summary : "") || t.summaries[verdict],
    subject: doc ? doc.type || t.subject.document : image ? t.subject.screenshot : t.subject.message,
    scheme: verdict === "safe" ? null : (ai?.scheme ?? links.find((l) => l.scheme)?.scheme ?? null),
    signals: sortSignals(signals),
    advice: (aiMatches && ai!.advice.length ? ai!.advice : t.advice[verdict]),
    facts,
    indicators,
    reports: links.reduce((a, l) => a + l.reports, 0),
    links,
    lang,
    aiSkipped: !ai,
  };
}
