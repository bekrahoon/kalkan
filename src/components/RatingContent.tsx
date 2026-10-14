"use client";

import { useState } from "react";
import { ChevronRight, Database, Download, Info, Trophy } from "lucide-react";
import { useLang } from "./LangProvider";
import { ReportView } from "./ReportView";
import { RATING_SERVICES, type RatingService } from "@/content/rating-services";
import { RATING, ratingCsv } from "@/lib/rating";
import type { AnalyzeMeta, Lang, Report, RiskLevel } from "@/lib/types";
import { upgradeReport } from "@/lib/normalize";

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
const DATA = RATING as { generatedAt: string | null; items: Record<string, RatingItem> };
const STATIC_DEMO = process.env.NEXT_PUBLIC_KALKAN_STATIC === "1";

const LEVEL_CHIP: Record<RiskLevel, string> = { low: "chip-no", medium: "chip-yes", high: "chip-danger" };
const LEVEL_BAR: Record<RiskLevel, string> = { low: "bg-primary", medium: "bg-[var(--meter-medium)]", high: "bg-danger" };

function pick(item: RatingItem, lang: Lang): { entry: Entry; lang: Lang } | null {
  const own = item[lang];
  const otherLang: Lang = lang === "ru" ? "ky" : "ru";
  const chosen = own ? { entry: own, lang } : item[otherLang] ? { entry: item[otherLang]!, lang: otherLang } : null;
  return chosen ? { entry: { ...chosen.entry, report: upgradeReport(chosen.entry.report, chosen.lang) }, lang: chosen.lang } : null;
}

export function RatingContent() {
  const { t, lang } = useLang();
  const tr = t.rating;
  const [open, setOpen] = useState<{ service: RatingService; entry: Entry; lang: Lang } | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const rows = RATING_SERVICES.map((s) => {
    const item = DATA.items[s.id];
    const chosen = item ? pick(item, lang) : null;
    return chosen ? { service: s, ...chosen, analyzedAt: item?.analyzedAt } : null;
  })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => !cat || r.service.category.ru === cat)
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
    ? new Date(DATA.generatedAt).toLocaleDateString("ru-RU", lang === "ky" ? undefined : { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="eyebrow">{tr.kicker}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,7vw,2.6rem)] font-bold leading-tight">{tr.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{tr.lead}</p>
      {date && <p className="mt-2 text-sm text-muted">{tr.checked(date)}</p>}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {[null, ...Array.from(new Set(RATING_SERVICES.filter((s) => DATA.items[s.id]).map((s) => s.category.ru)))].map((c) => {
          const label = c ? RATING_SERVICES.find((s) => s.category.ru === c)!.category[lang] : tr.all;
          return (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${cat === c ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-muted"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="card mt-8 p-6 text-center text-muted">{tr.empty}</div>
      ) : (
        <ol className="card mt-4 divide-y divide-line">
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

      {rows.length > 0 && (
        <section className="card mt-8 p-5" aria-labelledby="open-data">
          <h2 id="open-data" className="flex items-center gap-2 font-semibold">
            <Database className="h-5 w-5 text-primary" aria-hidden />
            {tr.openTitle}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{tr.openText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary min-h-[42px] text-sm"
              onClick={() => {
                const blob = new Blob(["\uFEFF" + ratingCsv(lang)], { type: "text/csv;charset=utf-8" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `kalkan-rating-${lang}.csv`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
              }}
            >
              <Download className="h-4 w-4" aria-hidden />
              {tr.csv}
            </button>
            {!STATIC_DEMO && (
              <a href={`/api/rating?lang=${lang}`} className="btn btn-secondary min-h-[42px] text-sm" target="_blank" rel="noopener">
                JSON API
              </a>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">{tr.license}</p>
        </section>
      )}
    </div>
  );
}
