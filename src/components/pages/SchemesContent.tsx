"use client";

import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { useLang } from "@/components/providers/LangProvider";
import { SCHEMES } from "@/content/schemes";
import { SCHEME_IDS } from "@/lib/types";

export function SchemesContent() {
  const { t, lang } = useLang();
  const c = t.schemes;
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="eyebrow">{c.kicker}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,7vw,2.6rem)] font-bold leading-tight">{c.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{c.lead}</p>

      <ul className="mt-8 space-y-4">
        {SCHEME_IDS.map((id) => {
          const s = SCHEMES[lang][id];
          return (
            <li key={id} id={id} className="card scroll-mt-24 p-5">
              <h2 className="text-xl font-bold">{s.name}</h2>
              <p className="mt-2 leading-relaxed">{s.how}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-danger">{c.signs}</h3>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-snug marker:text-muted">
                    {s.signs.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary">{c.todo}</h3>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-snug marker:text-muted">
                    {s.todo.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 text-center">
        <Link href="/" className="btn btn-primary">
          <ScanSearch className="h-5 w-5" aria-hidden />
          {c.cta}
        </Link>
      </div>
    </div>
  );
}
