"use client";

import Link from "next/link";
import { BrainCircuit, Languages, ScanSearch, ShieldHalf, TriangleAlert, UserRound } from "lucide-react";
import { useLang } from "./LangProvider";
import { Reveal } from "./Reveal";
import { ShieldLogo } from "./ShieldLogo";
import { ABOUT_PAGE, TEAM } from "@/content/pages";

const WHY_ICONS = [ShieldHalf, Languages, BrainCircuit];

export function AboutContent() {
  const { lang } = useLang();
  const c = ABOUT_PAGE[lang];

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
      <header className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <span className="caption">{c.kicker}</span>
          <h1 className="display hero-title mt-4 text-[clamp(2.6rem,10vw,4.5rem)]">{c.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg/90">{c.lead}</p>
        </div>
        <div className="panel tilt-r mx-auto p-6">
          <ShieldLogo size={140} animated title="Калкан" />
        </div>
      </header>

      <Reveal className="mt-12">
        <div className="bubble">
          <h2 className="display text-2xl">{c.missionTitle}</h2>
          <p className="mt-2 text-[17px] leading-relaxed">{c.mission}</p>
        </div>
      </Reveal>

      <section className="mt-14" aria-labelledby="why">
        <h2 id="why" className="display slant inked mb-6 text-3xl text-white sm:text-4xl">
          {c.whyTitle}
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {c.why.map(([title, text], i) => {
            const Icon = WHY_ICONS[i];
            return (
              <Reveal as="li" key={title} delay={i * 80} className={`panel panel-halftone p-5 ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                <Icon className="h-8 w-8 text-teal" aria-hidden />
                <h3 className="display mt-3 text-2xl text-white">{title}</h3>
                <p className="mt-1 text-sm leading-snug text-fg/85">{text}</p>
              </Reveal>
            );
          })}
        </ul>
      </section>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <section aria-labelledby="how">
          <h2 id="how" className="display slant inked mb-6 text-3xl text-white">
            {c.howTitle}
          </h2>
          <ol className="space-y-4">
            {c.how.map((s, i) => (
              <Reveal as="li" key={i} delay={i * 70} className="panel flex gap-4 p-4">
                <span className="display inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border-[3px] border-black bg-teal text-lg text-black">
                  {i + 1}
                </span>
                <p className="text-sm leading-snug">{s}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits" className="display slant inked mb-6 text-3xl text-white">
            {c.limitsTitle}
          </h2>
          <Reveal className="panel tilt-r p-5">
            <ul className="space-y-4">
              {c.limits.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm leading-snug">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      </div>

      <section className="mt-14" aria-labelledby="team">
        <h2 id="team" className="display slant inked mb-6 text-3xl text-white sm:text-4xl">
          {c.teamTitle}
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TEAM[lang].map((m, i) => (
            <Reveal as="li" key={i} delay={i * 70} className={`panel p-4 text-center ${i % 2 ? "tilt-r" : "tilt-l"}`}>
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-black bg-ink-3 text-teal">
                <UserRound className="h-8 w-8" aria-hidden />
              </span>
              <p className="display mt-3 text-xl text-white">{m.name}</p>
              <p className="mt-1 text-xs text-muted">{m.role}</p>
            </Reveal>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <Link href="/" className="btn btn-primary text-lg">
            <ScanSearch className="h-5 w-5" aria-hidden />
            {c.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
