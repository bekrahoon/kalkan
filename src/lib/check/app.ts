import "server-only";
import gplay from "google-play-scraper";
import { CheckError } from "../ai";
import { reportCount } from "../reports";
import { VERDICT_RANK, type CheckResult, type Fact, type Lang, type Signal, type Verdict } from "../types";
import { aiForFacts } from "./ai-verdict";
import { sortSignals } from "./link";
import { BRANDS } from "./official";
import { fmtDate, TX } from "./texts";

/** Extracts the app id from a Google Play link like play.google.com/store/apps/details?id=com.example. */
export function parsePlayUrl(input: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
    if (!/(^|\.)play\.google\.com$/i.test(u.hostname) || !u.pathname.startsWith("/store/apps/details")) return null;
    const id = u.searchParams.get("id");
    return id && /^[\w.]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const PERM_GROUPS: [keyof (typeof TX)["ru"]["permNames"], RegExp][] = [
  ["contacts", /контакт|contacts/i],
  ["sms", /sms|смс/i],
  ["calls", /журнал.*вызов|звонк|call log/i],
  ["location", /местополож|location/i],
  ["mic", /микрофон|microphone/i],
  ["accessibility", /специальн.*возможн|accessibility/i],
];

const timeout = <T,>(p: Promise<T>, ms = 10_000) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

export async function checkApp(appId: string, lang: Lang, budgetMs = 35_000): Promise<CheckResult> {
  const t = TX[lang];
  const started = Date.now();
  const [appR, permsR] = await Promise.allSettled([
    timeout(gplay.app({ appId, lang: "en", country: "kg" })) as unknown as Promise<Record<string, unknown>>,
    timeout(gplay.permissions({ appId, lang: "ru", short: true } as unknown as Parameters<typeof gplay.permissions>[0])) as Promise<unknown[]>,
  ]);
  const app = appR.status === "fulfilled" ? appR.value : null;
  const permsRaw = permsR.status === "fulfilled" && Array.isArray(permsR.value) ? permsR.value : [];
  const perms = permsRaw.map((x) => (typeof x === "string" ? x : String((x as Record<string, unknown>)?.permission ?? "")));
  const groups = PERM_GROUPS.filter(([, re]) => perms.some((p) => re.test(p))).map(([id]) => id);

  const signals: Signal[] = [];
  const facts: Fact[] = [];
  const title = typeof app?.title === "string" ? app.title : appId;
  const installs = typeof app?.installs === "string" ? app.installs : "";
  const minInstalls = typeof app?.minInstalls === "number" ? app.minInstalls : 0;
  const score = typeof app?.score === "number" ? app.score : 0;
  const ratings = typeof app?.ratings === "number" ? app.ratings : 0;
  const released = typeof app?.released === "string" ? new Date(app.released) : null;
  const finance = app?.genreId === "FINANCE";

  if (!app) {
    signals.push({ level: "warn", text: t.appRemoved });
  } else {
    facts.push({ label: t.f.developer, value: String(app.developer ?? "") });
    if (installs) facts.push({ label: t.f.installs, value: installs });
    if (score) facts.push({ label: t.f.rating, value: `${score.toFixed(1)} / 5 (${ratings.toLocaleString("ru-RU")})` });
    if (released && !Number.isNaN(released.getTime())) facts.push({ label: t.f.released, value: fmtDate(released) });

    if (minInstalls < 1_000) signals.push({ level: "warn", text: t.fewInstalls(installs || "<1000") });
    else if (minInstalls >= 1_000_000) signals.push({ level: "good", text: t.manyInstalls(installs) });
    if (released && Date.now() - released.getTime() < 90 * 86_400_000) signals.push({ level: "warn", text: t.newApp(fmtDate(released)) });
    if (score && ratings > 50 && score < 3) signals.push({ level: "warn", text: t.lowRating(score.toFixed(1)) });
    else if (score >= 4.2 && ratings > 1_000) signals.push({ level: "good", text: t.goodRating(score.toFixed(1)) });

    const brand = BRANDS.find((b) => b.money && b.keywords.some((k) => title.toLowerCase().replace(/\s/g, "").includes(k.replace("-", ""))));
    if (brand && minInstalls < 100_000) signals.push({ level: "bad", text: t.fakeBrandApp(brand.name) });

    const sensitive = groups.filter((g) => g === "contacts" || g === "sms" || g === "calls");
    if (finance && sensitive.length && !brand) {
      signals.push({ level: minInstalls >= 1_000_000 ? "warn" : "bad", text: t.loanPerms(sensitive.map((g) => t.permNames[g]).join(", ")) });
    } else if (groups.length) {
      signals.push({ level: groups.includes("accessibility") ? "warn" : "info", text: t.perms(groups.map((g) => t.permNames[g]).join(", ")) });
    }
  }

  const indicators = [{ type: "app" as const, value: appId, display: title }];
  const reports = await reportCount(indicators);
  if (reports >= 3) signals.push({ level: "bad", text: t.reportsMany(reports) });
  else if (reports > 0) signals.push({ level: "warn", text: t.reportsFew(reports) });

  const bad = signals.filter((s) => s.level === "bad").length;
  const warn = signals.filter((s) => s.level === "warn").length;
  const good = signals.filter((s) => s.level === "good").length;
  let verdict: Verdict = bad ? "danger" : warn > good ? "suspicious" : good ? "safe" : "unknown";

  let aiTitle = "";
  let summary = "";
  let advice: string[] = [];
  let scheme: CheckResult["scheme"] = finance && bad ? "loan" : null;
  let aiSkipped = false;
  try {
    const ai = await aiForFacts(
      "app",
      {
        app_id: appId,
        title,
        developer: app?.developer,
        developer_email: app?.developerEmail,
        developer_website: app?.developerWebsite,
        category: app?.genre,
        installs,
        rating: score || undefined,
        ratings_count: ratings || undefined,
        released: released && !Number.isNaN(released.getTime()) ? released.toISOString().slice(0, 10) : undefined,
        description: typeof app?.description === "string" ? app.description.slice(0, 2000) : undefined,
        permissions: perms.slice(0, 30),
        found_on_google_play: Boolean(app),
        technical_findings: signals.map((s) => `${s.level}: ${s.text}`),
        rule_based_verdict: verdict,
      },
      lang,
      Math.max(5_000, budgetMs - (Date.now() - started)),
    );
    if (VERDICT_RANK[ai.verdict] > VERDICT_RANK[verdict]) verdict = ai.verdict;
    if (ai.verdict === verdict) {
      aiTitle = ai.title;
      summary = ai.summary;
      advice = ai.advice;
      for (const s of ai.signals) if (!signals.some((x) => x.text === s.text)) signals.push(s);
      if (ai.scheme && verdict !== "safe") scheme = ai.scheme;
    }
  } catch (e) {
    aiSkipped = true;
    if (!(e instanceof CheckError)) console.error("[app ai]", e);
  }

  return {
    kind: "app",
    verdict,
    title: aiTitle || t.titles[verdict],
    summary: summary || t.summaries[verdict],
    subject: title,
    scheme: verdict === "safe" ? null : scheme,
    signals: sortSignals(signals),
    advice: advice.length ? advice : t.advice[verdict],
    facts,
    indicators,
    reports,
    links: [],
    lang,
    aiSkipped,
  };
}
