"use client";

import Link from "next/link";
import { ScanSearch, Download, Eye, FileWarning, Hand, Megaphone, PencilLine, Scale, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { useLang } from "./LangProvider";
import { Reveal } from "./Reveal";
import { ShieldLogo } from "./ShieldLogo";
import { RIGHTS_PAGE } from "@/content/pages";

const POWER_ICONS = [Eye, PencilLine, Trash2, Undo2, Hand, Megaphone];

export function RightsContent() {
  const { lang } = useLang();
  const c = RIGHTS_PAGE[lang];

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="caption">{c.kicker}</span>
          <h1 className="display hero-title mt-4 text-[clamp(2.6rem,10vw,4.5rem)]">{c.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-fg/90">{c.lead}</p>
        </div>
        <ShieldLogo size={110} animated className="hidden shrink-0 sm:block" />
      </header>

      <Reveal className="panel panel-halftone tilt-l mt-10 p-5 sm:p-7">
        <h2 className="display slant inked flex items-center gap-3 text-3xl text-white">
          <Scale className="h-7 w-7 text-teal" aria-hidden />
          {c.humanTitle}
        </h2>
        {c.human.map((p, i) => (
          <p key={i} className="mt-4 leading-relaxed text-fg/90">
            {p}
          </p>
        ))}
      </Reveal>

      <Reveal className="mt-10">
        <div className="bubble">
          <h2 className="display text-2xl">{c.whatTitle}</h2>
          <p className="mt-2 leading-snug">{c.what}</p>
        </div>
        <ul className="mt-8 flex flex-wrap gap-2">
          {c.examples.map((e) => (
            <li key={e} className="chip bg-ink-3 px-3 py-1 text-sm text-fg">
              {e}
            </li>
          ))}
        </ul>
      </Reveal>

      <section className="mt-14" aria-labelledby="powers">
        <h2 id="powers" className="display slant inked mb-6 text-3xl text-white sm:text-4xl">
          {c.powersTitle}
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.powers.map(([title, text], i) => {
            const Icon = POWER_ICONS[i] ?? Download;
            return (
              <Reveal as="li" key={title} delay={(i % 3) * 80} className={`panel p-5 ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-black bg-teal text-black shadow-[3px_3px_0_#000]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="display mt-3 text-2xl text-white">{title}</h3>
                <p className="mt-1 text-sm leading-snug text-fg/85">{text}</p>
              </Reveal>
            );
          })}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="law">
        <Reveal className="relative rounded-md border-[3px] border-dashed border-amber bg-ink-2/90 p-5 sm:p-7">
          <span
            className="display absolute -top-4 right-4 rotate-6 border-[3px] border-black bg-amber px-3 py-1 text-lg text-black shadow-[3px_3px_0_#000]"
            aria-hidden
          >
            {c.draft}
          </span>
          <h2 id="law" className="display slant inked flex items-center gap-3 text-3xl text-white">
            <FileWarning className="h-7 w-7 text-amber" aria-hidden />
            {c.lawTitle}
            <span className="sr-only">({c.draft})</span>
          </h2>
          <p className="mt-3 text-sm font-semibold text-amber">{c.draftNote}</p>
          <dl className="mt-5 space-y-5">
            {c.law.map(([term, desc]) => (
              <div key={term}>
                <dt className="font-semibold text-white">{term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-fg/85">{desc}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="mt-14" aria-labelledby="habits">
        <h2 id="habits" className="display slant inked mb-6 flex items-center gap-3 text-3xl text-white sm:text-4xl">
          <ShieldCheck className="h-8 w-8 text-teal" aria-hidden />
          {c.habitsTitle}
        </h2>
        <ol className="space-y-3">
          {c.habits.map((h, i) => (
            <Reveal as="li" key={i} delay={i * 60} className="panel flex items-start gap-4 p-4">
              <span className="display inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border-[3px] border-black bg-amber text-lg text-black">
                {i + 1}
              </span>
              <p className="pt-1 leading-snug">{h}</p>
            </Reveal>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <Link href="/" className="btn btn-primary text-lg">
            <ScanSearch className="h-5 w-5" aria-hidden />
            {c.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
