"use client";

import { History, X } from "lucide-react";
import { useLang } from "@/components/providers/LangProvider";
import { VERDICT_STYLE } from "./VerdictView";
import { clearHistory, removeFromHistory, useHistory, type HistoryItem } from "@/lib/history";

export function HistoryPanel({ onOpen }: { onOpen: (item: HistoryItem) => void }) {
  const { t, lang } = useLang();
  const items = useHistory();
  if (items.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="history-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="history-title" className="flex items-center gap-2 text-lg font-bold">
          <History className="h-5 w-5 text-primary" aria-hidden />
          {t.history.title}
        </h2>
        <button type="button" onClick={clearHistory} className="min-h-[40px] text-sm text-muted hover:text-fg">
          {t.history.clear}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">{t.history.note}</p>

      <ul className="card mt-3 divide-y divide-line">
        {items.map((h) => {
          const style = VERDICT_STYLE[h.result.verdict];
          return (
            <li key={h.id} className="flex items-center gap-1 py-1 pl-1 pr-1">
              <button
                type="button"
                onClick={() => onOpen(h)}
                className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left hover:bg-subtle"
              >
                <style.Icon className={`h-5 w-5 shrink-0 ${style.text}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{h.label}</span>
                  <span className="block text-xs text-muted">
                    <span className={`font-semibold ${style.text}`}>{t.verdict.label[h.result.verdict]}</span>
                    {" · "}
                    {new Date(h.at).toLocaleDateString(lang === "en" ? "en-GB" : "ru-RU", lang === "ky" ? { day: "2-digit", month: "2-digit" } : { day: "numeric", month: "short" })}
                    {h.example && ` · ${t.history.example}`}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeFromHistory(h.id)}
                aria-label={`${t.history.remove}: ${h.label}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-fg"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
