"use client";

import Link from "next/link";
import { Eye, FileWarning, Hand, Megaphone, PencilLine, Scale, ScanSearch, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { useLang } from "./LangProvider";
import { RIGHTS_PAGE } from "@/content/pages";

const POWER_ICONS = [Eye, PencilLine, Trash2, Undo2, Hand, Megaphone];

export function RightsContent() {
  const { lang } = useLang();
  const c = RIGHTS_PAGE[lang];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <header>
        <p className="eyebrow">{c.kicker}</p>
        <h1 className="mt-2 text-[clamp(2rem,7vw,2.75rem)] font-bold leading-tight">{c.title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">{c.lead}</p>
      </header>

      <section className="card mt-8 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 text-xl font-bold">
          <Scale className="h-5 w-5 text-primary" aria-hidden />
          {c.humanTitle}
        </h2>
        {c.human.map((p, i) => (
          <p key={i} className="mt-3 leading-relaxed">
            {p}
          </p>
        ))}
      </section>

      <section className="mt-6 rounded-2xl bg-primary-soft p-5 sm:p-6">
        <h2 className="text-xl font-bold">{c.whatTitle}</h2>
        <p className="mt-2 leading-relaxed">{c.what}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {c.examples.map((e) => (
            <li key={e} className="rounded-full bg-surface px-3 py-1 text-sm">
              {e}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="powers">
        <h2 id="powers" className="mb-4 text-2xl font-bold">
          {c.powersTitle}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {c.powers.map(([title, text], i) => {
            const Icon = POWER_ICONS[i];
            return (
              <li key={title} className="card flex gap-3 p-4">
                <span className="icon-badge bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-0.5 text-sm leading-snug text-muted">{text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-warn bg-warn-soft p-5 sm:p-6" aria-labelledby="law">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="law" className="flex items-center gap-2.5 text-xl font-bold">
            <FileWarning className="h-5 w-5 text-warn" aria-hidden />
            {c.lawTitle}
          </h2>
          <span className="chip bg-surface text-warn">{c.draft}</span>
        </div>
        <p className="mt-2 text-sm text-warn">{c.draftNote}</p>
        <dl className="mt-4 space-y-4">
          {c.law.map(([term, desc]) => (
            <div key={term}>
              <dt className="font-semibold">{term}</dt>
              <dd className="mt-1 text-sm leading-relaxed">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10" aria-labelledby="habits">
        <h2 id="habits" className="mb-4 flex items-center gap-2.5 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
          {c.habitsTitle}
        </h2>
        <ul className="card divide-y divide-line px-4">
          {c.habits.map((h, i) => (
            <li key={i} className="flex gap-3 py-3.5 leading-snug">
              <span className="mt-0.5 h-2 w-2 shrink-0 translate-y-1.5 rounded-full bg-primary" aria-hidden />
              {h}
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Link href="/" className="btn btn-primary">
            <ScanSearch className="h-5 w-5" aria-hidden />
            {c.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
