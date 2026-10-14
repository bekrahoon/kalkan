import {
  CATEGORY_IDS,
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

  let score = Number(r.risk_score);
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
        quote_verified: sourceText && quote ? quoteAppearsIn(quote, sourceText) : undefined,
      };
    })
    .filter((f) => f.explanation && (f.title || f.quote))
    .slice(0, 5);

  const other_data = arr(r.other_data)
    .map((x) => str(x))
    .filter(Boolean)
    .slice(0, 8);

  return {
    company_name: str(r.company_name),
    contact_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(r.contact_email)) ? str(r.contact_email) : "",
    summary: str(r.summary, ns),
    risk_score: score,
    risk_level: levelFromScore(score),
    data_categories,
    other_data,
    third_parties,
    retention,
    red_flags,
    user_rights,
  };
}
