"use client";

import { useEffect, useState } from "react";
import { Baby, ChevronDown, Smartphone } from "lucide-react";
import { useLang } from "./LangProvider";
import { GUIDES, type GuideSection } from "@/content/guides";

function initialTab(): GuideSection["id"] {
  const q = window.location.search || window.location.hash.split("?")[1] || "";
  return new URLSearchParams(q.startsWith("?") ? q : `?${q}`).get("for") === "parents" ? "parents" : "phone";
}

function Steps({ label, items }: { label?: string; items: string[] }) {
  return (
    <div className="min-w-0">
      {label && <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted">{label}</p>}
      <ol className="space-y-1.5">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-snug">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function GuidesContent() {
  const { t, lang } = useLang();
  const sections = GUIDES[lang];
  const [tab, setTab] = useState<GuideSection["id"]>("phone");
  useEffect(() => {
    const id = setTimeout(() => setTab(initialTab()), 0);
    return () => clearTimeout(id);
  }, []);
  const section = sections.find((s) => s.id === tab) ?? sections[0];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="eyebrow">{t.guides.kicker}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,7vw,2.6rem)] font-bold leading-tight">{t.guides.title}</h1>

      <div role="tablist" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1">
        {sections.map((s) => {
          const Icon = s.id === "parents" ? Baby : Smartphone;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={tab === s.id}
              onClick={() => setTab(s.id)}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-sm font-medium ${
                tab === s.id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {s.tab}
            </button>
          );
        })}
      </div>

      <p className="mt-5 leading-relaxed text-muted">{section.lead}</p>

      <ul className="mt-5 space-y-3">
        {section.guides.map((g, i) => (
          <li key={g.id}>
            <details className="card group p-0" open={i === 0}>
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 font-semibold leading-snug">{g.title}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="border-t border-line px-4 pb-4 pt-3">
                <p className="text-sm leading-relaxed text-muted">{g.why}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {g.android && <Steps label="Android" items={g.android} />}
                  {g.iphone && <Steps label="iPhone" items={g.iphone} />}
                  {g.steps && <Steps items={g.steps} />}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">{t.guides.note}</p>
    </div>
  );
}
