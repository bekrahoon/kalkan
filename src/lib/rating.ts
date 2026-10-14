import ratingData from "@/content/rating-data.json";
import { RATING_SERVICES } from "@/content/rating-services";
import type { AnalyzeMeta, Lang, Report } from "./types";

export interface RatingEntry {
  report: Report;
  meta: AnalyzeMeta;
}
export interface RatingItem {
  analyzedAt?: string;
  appId?: string;
  ru?: RatingEntry;
  ky?: RatingEntry;
}
export const RATING = ratingData as unknown as { generatedAt: string | null; items: Record<string, RatingItem> };

/** Flat rows for open data (JSON API and CSV download). */
export function ratingRows(lang: Lang) {
  return RATING_SERVICES.flatMap((s) => {
    const item = RATING.items[s.id];
    const e = item?.[lang] ?? item?.ru;
    if (!e) return [];
    const r = e.report;
    return [
      {
        id: s.id,
        name: s.name,
        category: s.category[lang],
        google_play_id: item?.appId ?? null,
        policy_url: e.meta.sourceUrl ?? null,
        analyzed_at: item?.analyzedAt ?? null,
        risk_score: r.risk_score,
        risk_level: r.risk_level,
        red_flags: r.red_flags.length,
        collects: r.data_categories.filter((c) => c.collected === "yes").map((c) => c.category),
        third_parties: r.third_parties.length,
        cross_border: r.third_parties.some((p) => p.cross_border),
        can_delete: r.retention.can_delete,
        rights_available: r.user_rights.filter((u) => u.available === "yes").length,
        play_permissions: e.meta.play?.permissions ?? [],
        top_flags: r.red_flags.map((f) => f.title),
      },
    ];
  }).sort((a, b) => a.risk_score - b.risk_score);
}

export function ratingCsv(lang: Lang): string {
  const rows = ratingRows(lang);
  const cols = ["id", "name", "category", "risk_score", "risk_level", "red_flags", "third_parties", "cross_border", "can_delete", "rights_available", "collects", "google_play_id", "policy_url", "analyzed_at"] as const;
  const cell = (v: unknown) => {
    const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}
