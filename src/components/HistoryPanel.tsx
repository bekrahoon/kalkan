"use client";

import { useState } from "react";
import { GitCompareArrows, History, X } from "lucide-react";
import { useLang } from "./LangProvider";
import { clearHistory, removeFromHistory, useHistory, type HistoryItem } from "@/lib/history";
import type { RiskLevel } from "@/lib/types";

const LEVEL_CHIP: Record<RiskLevel, string> = { low: "chip-no", medium: "chip-yes", high: "chip-danger" };

export function HistoryPanel({
  onOpen,
  onCompare,
}: {
  onOpen: (item: HistoryItem) => void;
  onCompare: (a: HistoryItem, b: HistoryItem) => void;
}) {
  const { t, lang } = useLang();
  const items = useHistory();
  const [picked, setPicked] = useState<string[]>([]);
  if (items.length === 0) return null;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p.slice(-1), id]));
  const chosen = picked.map((id) => items.find((h) => h.id === id)).filter(Boolean) as HistoryItem[];

  return (
    <section className="mt-10" aria-labelledby="history-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="history-title" className="flex items-center gap-2 text-lg font-bold">
          <History className="h-5 w-5 text-primary" aria-hidden />
          {t.history.title}
        </h2>
        <button
          type="button"
          onClick={() => {
            clearHistory();
            setPicked([]);
          }}
          className="min-h-[40px] text-sm text-muted hover:text-fg"
        >
          {t.history.clear}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        {t.history.note} {items.length > 1 && t.history.compareHint}
      </p>

      <ul className="card mt-3 divide-y divide-line">
        {items.map((h) => (
          <li key={h.id} className="flex items-center gap-2 py-1 pl-2 pr-1">
            {items.length > 1 && (
              <input
                type="checkbox"
                checked={picked.includes(h.id)}
                onChange={() => toggle(h.id)}
                aria-label={`${t.history.select}: ${h.label}`}
                className="h-5 w-5 shrink-0 accent-[var(--primary)]"
              />
            )}
            <button
              type="button"
              onClick={() => onOpen(h)}
              className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left hover:bg-subtle"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{h.label}</span>
                <span className="block text-xs text-muted">
                  {new Date(h.at).toLocaleDateString(lang === "ky" ? "ky-KG" : "ru-RU", { day: "numeric", month: "short" })}
                  {h.example && ` · ${t.history.example}`}
                  {h.lang !== lang && ` · ${h.lang === "ky" ? "KG" : "RU"}`}
                </span>
              </span>
              <span className={`chip ${LEVEL_CHIP[h.report.risk_level]} tabular-nums`}>{h.report.risk_score}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                removeFromHistory(h.id);
                setPicked((p) => p.filter((x) => x !== h.id));
              }}
              aria-label={`${t.history.remove}: ${h.label}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-fg"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {items.length > 1 && (
        <button
          type="button"
          disabled={chosen.length !== 2}
          onClick={() => chosen.length === 2 && onCompare(chosen[0], chosen[1])}
          className="btn btn-secondary mt-3 w-full"
        >
          <GitCompareArrows className="h-4 w-4" aria-hidden />
          {t.history.compare} {chosen.length > 0 && `(${chosen.length}/2)`}
        </button>
      )}
    </section>
  );
}
