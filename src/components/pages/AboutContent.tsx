"use client";

import Link from "next/link";
import { BrainCircuit, ChevronDown, Info, KeyRound, ScanSearch, UserRound, Wallet } from "lucide-react";
import { useLang } from "@/components/providers/LangProvider";
import { ShieldLogo } from "@/components/ui/ShieldLogo";
import { ABOUT_PAGE, TEAM } from "@/content/pages";
import { ACCURACY_TEXT } from "@/content/accuracy";

const WHY_ICONS = [Wallet, KeyRound, BrainCircuit];

export function AboutContent() {
  const { lang } = useLang();
  const c = ABOUT_PAGE[lang];
  const acc = ACCURACY_TEXT[lang];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ShieldLogo size={64} title="KalkanCheck" className="shrink-0" />
        <div>
          <p className="eyebrow">{c.kicker}</p>
          <h1 className="mt-1 text-[clamp(2rem,7vw,2.75rem)] font-bold leading-tight">{c.title}</h1>
        </div>
      </header>
      <p className="mt-4 text-lg leading-relaxed text-muted">{c.lead}</p>

      <section className="mt-8 rounded-2xl bg-primary-soft p-5 sm:p-6">
        <h2 className="text-xl font-bold">{c.missionTitle}</h2>
        <p className="mt-2 leading-relaxed">{c.mission}</p>
      </section>

      <section className="mt-10" aria-labelledby="accuracy">
        <h2 id="accuracy" className="text-2xl font-bold">
          {acc.title}
        </h2>
        <p className="mt-2 leading-relaxed text-muted">{acc.lead}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {acc.tiles.map(([value, label]) => (
            <li key={label} className="card p-4">
              <p className="text-3xl font-bold tabular-nums text-primary">{value}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{label}</p>
            </li>
          ))}
        </ul>
        <details className="group mt-3 rounded-2xl bg-subtle">
          <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-4 font-medium">
            {acc.methodTitle}
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="list-disc space-y-2 px-4 pb-4 pl-9 text-sm leading-snug marker:text-muted">
            {acc.method.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </details>
      </section>

      <section className="mt-10" aria-labelledby="why">
        <h2 id="why" className="mb-4 text-2xl font-bold">
          {c.whyTitle}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {c.why.map(([title, text], i) => {
            const Icon = WHY_ICONS[i];
            return (
              <li key={title} className="card p-4">
                <span className="icon-badge bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-snug text-muted">{text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="how">
        <h2 id="how" className="mb-4 text-2xl font-bold">
          {c.howTitle}
        </h2>
        <ol className="card divide-y divide-line px-4">
          {c.how.map((s, i) => (
            <li key={i} className="flex gap-3 py-3.5 text-sm leading-snug">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="pt-1">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-2xl bg-subtle p-5" aria-labelledby="limits">
        <h2 id="limits" className="flex items-center gap-2 text-lg font-bold">
          <Info className="h-5 w-5 text-primary" aria-hidden />
          {c.limitsTitle}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-snug marker:text-muted">
          {c.limits.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="team">
        <h2 id="team" className="mb-4 text-2xl font-bold">
          {c.teamTitle}
        </h2>
        <ul className={TEAM[lang].length > 1 ? "grid grid-cols-2 gap-3 sm:grid-cols-4" : "grid max-w-xs gap-3"}>
          {TEAM[lang].map((m, i) => (
            <li key={i} className="card p-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-muted">
                <UserRound className="h-6 w-6" aria-hidden />
              </span>
              <p className="mt-2 font-semibold">{m.name}</p>
              <p className="mt-0.5 text-xs text-muted">{m.role}</p>
              {m.links && (
                <p className="mt-2 flex justify-center gap-3 text-sm">
                  {m.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {l.label}
                    </a>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <Link href="/" className="btn btn-primary">
            <ScanSearch className="h-5 w-5" aria-hidden />
            {c.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
