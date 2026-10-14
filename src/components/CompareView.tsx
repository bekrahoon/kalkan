"use client";

import { ArrowLeft, Trophy } from "lucide-react";
import { useLang } from "./LangProvider";
import type { HistoryItem } from "@/lib/history";
import { upgradeReport } from "@/lib/normalize";
import type { RiskLevel, TriState } from "@/lib/types";

const LEVEL_CHIP: Record<RiskLevel, string> = { low: "chip-no", medium: "chip-yes", high: "chip-danger" };

/** Side-by-side view of two saved reports. Lower score = safer; ties within 5 points count as equal. */
export function CompareView({ a: rawA, b: rawB, onBack }: { a: HistoryItem; b: HistoryItem; onBack: () => void }) {
  const a = { ...rawA, report: upgradeReport(rawA.report, rawA.lang) };
  const b = { ...rawB, report: upgradeReport(rawB.report, rawB.lang) };
  const { t } = useLang();
  const tc = t.compare;
  const tr = t.report;
  const pair = [a, b];
  const diff = a.report.risk_score - b.report.risk_score;
  const safer = Math.abs(diff) < 5 ? null : diff < 0 ? a : b;

  const triChip = (v: TriState, goodWhenYes: boolean) => {
    if (v === "unclear") return <span className="chip chip-unclear">{tr.tri.unclear}</span>;
    const good = goodWhenYes ? v === "yes" : v === "no";
    return <span className={`chip ${good ? "chip-no" : "chip-yes"}`}>{v === "yes" ? tc.yes : tc.no}</span>;
  };

  const rows: { label: string; cell: (h: HistoryItem) => React.ReactNode }[] = [
    {
      label: tc.score,
      cell: (h) => (
        <span className={`chip ${LEVEL_CHIP[h.report.risk_level]} text-sm tabular-nums`}>{h.report.risk_score}</span>
      ),
    },
    { label: tc.flags, cell: (h) => <span className="font-semibold tabular-nums">{h.report.red_flags.length}</span> },
    { label: tc.parties, cell: (h) => <span className="font-semibold tabular-nums">{h.report.third_parties.length}</span> },
    {
      label: tc.crossBorder,
      cell: (h) => triChip(h.report.third_parties.some((p) => p.cross_border) ? "yes" : "no", false),
    },
    { label: tc.canDelete, cell: (h) => triChip(h.report.retention.can_delete, true) },
    {
      label: tc.rights,
      cell: (h) => (
        <span className="font-semibold tabular-nums">{h.report.user_rights.filter((r) => r.available === "yes").length}</span>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 pt-6 sm:pt-10">
      <button type="button" onClick={onBack} className="mb-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {tc.back}
      </button>
      <h1 className="text-2xl font-bold sm:text-3xl">{tc.title}</h1>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary-soft p-4">
        <Trophy className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm">
          {safer ? (
            <>
              {tc.safer} <strong>{safer.label}</strong>
            </>
          ) : (
            tc.same
          )}
        </p>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="w-[40%] p-3 text-left font-medium text-muted" scope="col">
                <span className="sr-only">{tc.title}</span>
              </th>
              {pair.map((h) => (
                <th key={h.id} scope="col" className="p-3 text-left font-semibold leading-snug">
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="p-3 text-left font-normal text-muted">
                  {r.label}
                </th>
                {pair.map((h) => (
                  <td key={h.id} className="p-3">
                    {r.cell(h)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" colSpan={3} className="bg-subtle px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                {tc.collected}
              </th>
            </tr>
            {a.report.data_categories.map((c, i) => (
              <tr key={c.category}>
                <th scope="row" className="p-3 text-left font-normal text-muted">
                  {tr.categories[c.category]}
                </th>
                {pair.map((h) => (
                  <td key={h.id} className="p-3">
                    {(() => {
                      const v = h.report.data_categories[i]?.collected ?? "unclear";
                      return <span className={`chip ${v === "yes" ? "chip-yes" : v === "no" ? "chip-no" : "chip-unclear"}`}>{tr.tri[v]}</span>;
                    })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
