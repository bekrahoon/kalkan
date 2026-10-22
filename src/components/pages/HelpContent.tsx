"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useLang } from "@/components/providers/LangProvider";

export function HelpContent() {
  const { t } = useLang();
  const c = t.help;
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="eyebrow">{c.kicker}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,7vw,2.6rem)] font-bold leading-tight">{c.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{c.lead}</p>

      <ol className="mt-8 space-y-3">
        {c.steps.map(([title, text], i) => (
          <li key={title} className="card flex gap-4 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{i + 1}</span>
            <div>
              <h2 className="text-lg font-bold">
                {i === c.steps.length - 1 ? <Link href="/" className="hover:text-primary">{title}</Link> : title}
              </h2>
              <p className="mt-1 leading-relaxed text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 flex gap-3 rounded-2xl bg-danger-soft p-4 font-medium">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
        {c.never}
      </p>
    </div>
  );
}
