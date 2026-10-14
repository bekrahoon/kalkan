"use client";

import { useState } from "react";
import { ChevronRight, Info, Trophy } from "lucide-react";
import { useLang } from "./LangProvider";
import { ReportView } from "./ReportView";
import { RATING_SERVICES, type RatingService } from "@/content/rating-services";
import ratingData from "@/content/rating-data.json";
import type { AnalyzeMeta, Lang, Report, RiskLevel } from "@/lib/types";

interface Entry {
  report: Report;
  meta: AnalyzeMeta;
}
interface RatingItem {
  analyzedAt?: string;
  appId?: string;
  ru?: Entry;
  ky?: Entry;
}
const DATA = ratingData as unknown as { generatedAt: string | null; items: Record<string, RatingItem> };

const LEVEL_CHIP: Record<RiskLevel, string> = { low: "chip-no", medium: "chip-yes", high: "chip-danger" };
const LEVEL_BAR: Record<RiskLevel, string> = { low: "bg-primary", medium: "bg-[var(--meter-medium)]", high: "bg-danger" };

function pick(item: RatingItem, lang: Lang): { entry: Entry; lang: Lang } | null {
  const own = item[lang];
  if (own) return { entry: own, lang };
  const other = lang === "ru" ? item.ky : item.ru;
  return other ? { entry: other, lang: lang === "ru" ? "ky" : "ru" } : null;
}

export function RatingContent() {
  const { t, lang } = useLang();
  const tr = t.rating;
  const [open, setOpen] = useState<{ service: RatingService; entry: Entry; lang: Lang } | null>(null);

  const rows = RATING_SERVICES.map((s) => {
    const item = DATA.items[s.id];
    const chosen = item ? pick(item, lang) : null;
    return chosen ? { service: s, ...chosen, analyzedAt: item?.analyzedAt } : null;
  })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.entry.report.risk_score - b.entry.report.risk_score);

  if (open) {
    return (
      <div>
        <div className="mx-auto max-w-4xl px-4 pt-6">
          <p className="eyebrow">{open.service.category[lang]}</p>
        </div>
        <ReportView
          report={open.entry.report}
          meta={open.entry.meta}
          reportLang={open.lang}
          onReset={() => {
            setOpen(null);
            window.scrollTo({ top: 0 });
          }}
          backLabel={tr.back}
        />
      </div>
    );
  }

  const date = DATA.generatedAt
    ? new Date(DATA.generatedAt).toLocaleDateString(lang === "ky" ? "ky-KG" : "ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="eyebrow">{tr.kicker}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,7vw,2.6rem)] font-bold leading-tight">{tr.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{tr.lead}</p>
      {date && <p className="mt-2 text-sm text-muted">{tr.checked(date)}</p>}

      {rows.length === 0 ? (
        <div className="card mt-8 p-6 text-center text-muted">{tr.empty}</div>
      ) : (
        <ol className="card mt-8 divide-y divide-line">
          {rows.map((r, i) => (
            <li key={r.service.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen({ service: r.service, entry: r.entry, lang: r.lang });
                  window.scrollTo({ top: 0 });
                }}
                className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle"
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted">
                  {i === 0 ? <Trophy className="mx-auto h-4 w-4 text-primary" aria-label="1" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.service.name}</span>
                  <span className="block text-xs text-muted">
                    {r.service.category[lang]} · {tr.flags(r.entry.report.red_flags.length)}
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-subtle" aria-hidden>
                    <span
                      className={`block h-full rounded-full ${LEVEL_BAR[r.entry.report.risk_level]}`}
                      style={{ width: `${Math.max(4, r.entry.report.risk_score)}%` }}
                    />
                  </span>
                </span>
                <span className={`chip ${LEVEL_CHIP[r.entry.report.risk_level]} tabular-nums`}>{r.entry.report.risk_score}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {tr.note}
      </p>
    </div>
  );
}
