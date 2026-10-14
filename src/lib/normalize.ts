import {
  BASE_SCORE,
  CATEGORY_IDS,
  COMPLIANCE_ITEMS,
  type ComplianceCheck,
  type ComplianceItem,
  RECIPIENT_TYPES,
  RIGHT_IDS,
  type CategoryId,
  type DataCategory,
  type Lang,
  type RecipientType,
  type Report,
  type RiskLevel,
  type RightId,
  type TriState,
  type UserRight,
} from "./types";

export const NOT_SPECIFIED: Record<Lang, string> = {
  ru: "Не указано в политике",
  ky: "Саясатта көрсөтүлгөн эмес",
};

export function levelFromScore(score: number): RiskLevel {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

const tri = (v: unknown): TriState =>
  v === "yes" || v === "no" || v === "unclear" ? v : "unclear";

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

/** Lowercase, unify quotes/dashes and collapse whitespace so quote checks survive formatting noise. */
export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»“”„"]/g, '"')
    .replace(/[‘’`]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/ё/g, "е")
    .replace(/[\s ]+/g, " ")
    .replace(/^[\s".…]+|[\s".…]+$/g, "")
    .trim();
}

export function quoteAppearsIn(quote: string, source: string): boolean {
  const q = normalizeForMatch(quote).replace(/\.\.\.|…/g, " ");
  if (q.length < 8) return false;
  const src = normalizeForMatch(source);
  if (src.includes(q)) return true;
  // Quotes trimmed with an ellipsis in the middle: every fragment must be present.
  const parts = q.split(/\s{2,}/).map((p) => p.trim()).filter((p) => p.length >= 8);
  return parts.length > 1 && parts.every((p) => src.includes(p));
}

/**
 * Turns whatever the model returned into a well-formed Report.
 * Never trusts the model blindly: clamps numbers, fills gaps, keeps enums valid,
 * derives the level from the score so they can't contradict each other,
 * and marks quotes that don't really appear in the policy text.
 */
export function normalizeReport(raw: unknown, lang: Lang, sourceText?: string): Report {
  const r = obj(raw);
  const ns = NOT_SPECIFIED[lang];

  // "Why this score": keep sane factors, then make the score the exact sum so the breakdown always adds up.
  const risk_factors = arr(r.risk_factors)
    .map((item) => {
      const f = obj(item);
      const points = Math.round(Number(f.points));
      return { factor: str(f.factor), points: Number.isFinite(points) ? Math.max(-30, Math.min(30, points)) : 0 };
    })
    .filter((f) => f.factor && f.points !== 0)
    .slice(0, 10);

  let score = Number(r.risk_score);
  if (risk_factors.length) score = BASE_SCORE + risk_factors.reduce((a, f) => a + f.points, 0);
  if (!Number.isFinite(score)) score = 50;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const catMap = new Map<CategoryId, DataCategory>();
  for (const item of arr(r.data_categories)) {
    const c = obj(item);
    const id = c.category as CategoryId;
    if (!CATEGORY_IDS.includes(id) || catMap.has(id)) continue;
    catMap.set(id, { category: id, collected: tri(c.collected), details: str(c.details, ns) });
  }
  const data_categories = CATEGORY_IDS.map(
    (id) => catMap.get(id) ?? { category: id, collected: "unclear" as TriState, details: ns },
  );

  const rightMap = new Map<RightId, UserRight>();
  for (const item of arr(r.user_rights)) {
    const u = obj(item);
    const id = u.right as RightId;
    if (!RIGHT_IDS.includes(id) || rightMap.has(id)) continue;
    rightMap.set(id, { right: id, available: tri(u.available), details: str(u.details, ns) });
  }
  const user_rights = RIGHT_IDS.map(
    (id) => rightMap.get(id) ?? { right: id, available: "unclear" as TriState, details: ns },
  );

  const third_parties = arr(r.third_parties)
    .map((item) => {
      const t = obj(item);
      const type = RECIPIENT_TYPES.includes(t.type as RecipientType)
        ? (t.type as RecipientType)
        : "other";
      return {
        recipient: str(t.recipient),
        type,
        purpose: str(t.purpose, ns),
        cross_border: t.cross_border === true,
      };
    })
    .filter((t) => t.recipient)
    .slice(0, 10);

  const ret = obj(r.retention);
  const retention = {
    period: str(ret.period, ns),
    can_delete: tri(ret.can_delete),
    how_to_delete: str(ret.how_to_delete, ns),
  };

  const red_flags = arr(r.red_flags)
    .map((item) => {
      const f = obj(item);
      const quote = str(f.quote);
      return {
        title: str(f.title),
        quote,
        explanation: str(f.explanation),
        action: str(f.action),
        quote_verified: sourceText && quote ? quoteAppearsIn(quote, sourceText) : undefined,
      };
    })
    .filter((f) => f.explanation && (f.title || f.quote))
    .slice(0, 5);

  const other_data = arr(r.other_data)
    .map((x) => str(x))
    .filter(Boolean)
    .slice(0, 8);

  const ch = obj(r.children_check);
  const children_check = {
    min_age: str(ch.min_age, ns),
    parental_consent: tri(ch.parental_consent),
    ads_to_children: tri(ch.ads_to_children),
    summary: str(ch.summary, ns),
  };

  const compMap = new Map<ComplianceItem, ComplianceCheck>();
  for (const item of arr(r.compliance)) {
    const c = obj(item);
    const id = c.item as ComplianceItem;
    if (!COMPLIANCE_ITEMS.includes(id) || compMap.has(id)) continue;
    compMap.set(id, { item: id, status: tri(c.status), note: str(c.note) });
  }
  const compliance = COMPLIANCE_ITEMS.map((id) => compMap.get(id) ?? { item: id, status: "unclear" as TriState, note: "" });

  return {
    company_name: str(r.company_name),
    contact_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(r.contact_email)) ? str(r.contact_email) : "",
    summary: str(r.summary, ns),
    risk_score: score,
    risk_level: levelFromScore(score),
    risk_factors,
    data_categories,
    other_data,
    third_parties,
    retention,
    red_flags,
    user_rights,
    children_check,
    compliance,
  };
}

/** Takes the translated texts, but every number, enum, quote and verification flag from the original report. */
export function mergeTranslation(source: Report, translatedRaw: unknown, lang: Lang): Report {
  const tr = normalizeReport(translatedRaw, lang);
  const byIndex = <T,>(arr: T[], i: number): T | undefined => arr[i];
  return {
    ...source,
    summary: tr.summary || source.summary,
    risk_factors: source.risk_factors.map((f, i) => ({ ...f, factor: byIndex(tr.risk_factors, i)?.factor || f.factor })),
    data_categories: source.data_categories.map((c) => ({
      ...c,
      details: tr.data_categories.find((x) => x.category === c.category)?.details || c.details,
    })),
    other_data: source.other_data.map((o, i) => byIndex(tr.other_data, i) || o),
    third_parties: source.third_parties.map((p, i) => ({
      ...p,
      recipient: byIndex(tr.third_parties, i)?.recipient || p.recipient,
      purpose: byIndex(tr.third_parties, i)?.purpose || p.purpose,
    })),
    retention: {
      ...source.retention,
      period: tr.retention.period || source.retention.period,
      how_to_delete: tr.retention.how_to_delete || source.retention.how_to_delete,
    },
    red_flags: source.red_flags.map((f, i) => ({
      ...f,
      title: byIndex(tr.red_flags, i)?.title || f.title,
      explanation: byIndex(tr.red_flags, i)?.explanation || f.explanation,
      action: byIndex(tr.red_flags, i)?.action || f.action,
    })),
    children_check: {
      ...source.children_check,
      min_age: tr.children_check.min_age || source.children_check.min_age,
      summary: tr.children_check.summary || source.children_check.summary,
    },
    compliance: source.compliance.map((c) => ({
      ...c,
      note: tr.compliance.find((x) => x.item === c.item)?.note || c.note,
    })),
    user_rights: source.user_rights.map((u) => ({
      ...u,
      details: tr.user_rights.find((x) => x.right === u.right)?.details || u.details,
    })),
  };
}

/** Brings an older saved report (history, rating file) up to the current shape, keeping its quote checks. */
export function upgradeReport(raw: unknown, lang: Lang): Report {
  const report = normalizeReport(raw, lang);
  const old = obj(raw);
  const flags = arr(old.red_flags);
  report.red_flags = report.red_flags.map((f, i) => {
    const v = obj(flags[i]).quote_verified;
    return { ...f, quote_verified: typeof v === "boolean" ? v : undefined };
  });
  // keep the stored score even if the old file had no factors
  const score = Number(old.risk_score);
  if (!report.risk_factors.length && Number.isFinite(score)) {
    report.risk_score = Math.max(0, Math.min(100, Math.round(score)));
    report.risk_level = levelFromScore(report.risk_score);
  }
  return report;
}
