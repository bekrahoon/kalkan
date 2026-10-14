"use client";

import Link from "next/link";
import { useLang } from "./LangProvider";
import { CONSENT, CONTACT_URL, LEGAL_UPDATED, PRIVACY, TERMS } from "@/content/legal";

export function LegalContent({ doc }: { doc: "privacy" | "terms" }) {
  const { lang } = useLang();
  const d = (doc === "privacy" ? PRIVACY : TERMS)[lang];
  const c = CONSENT[lang];
  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <h1 className="text-[clamp(1.8rem,6.5vw,2.4rem)] font-bold leading-tight">{d.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {c.updated}: {LEGAL_UPDATED}
      </p>
      <p className="mt-5 text-lg leading-relaxed">{d.intro}</p>
      {d.sections.map((s) => (
        <section key={s.h} className="mt-8">
          <h2 className="text-xl font-bold">{s.h}</h2>
          <ul className="mt-3 space-y-2.5">
            {s.p.map((p) => (
              <li key={p} className="leading-relaxed text-fg/90">
                {p}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-10 text-sm text-muted">
        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {CONTACT_URL.replace("https://", "")}
        </a>
        {" · "}
        <Link href={doc === "privacy" ? "/terms" : "/privacy"} className="text-primary hover:underline">
          {doc === "privacy" ? c.terms : c.privacy}
        </Link>
      </p>
    </article>
  );
}
