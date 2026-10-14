"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";
import type { Lang } from "@/lib/types";

const LANGS: { id: Lang; label: string; full: string }[] = [
  { id: "ru", label: "RU", full: "Русский" },
  { id: "ky", label: "KG", full: "Кыргызча" },
];

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  const path = usePathname();
  const links = [
    { href: "/", label: t.nav.check },
    { href: "/rights", label: t.nav.rights },
    { href: "/about", label: t.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-black bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 sm:py-3">
        <Link href="/" className="group flex items-center gap-2" aria-label="Калкан">
          <ShieldLogo size={30} />
          <span className="leading-none">
            <span className="display slant inked block text-2xl tracking-wide text-white group-hover:text-teal">
              Калкан
            </span>
            <span className="hidden text-[11px] font-medium text-muted sm:block">{t.brandTagline}</span>
          </span>
        </Link>

        <nav aria-label={t.nav.menu} className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`display shrink-0 rounded px-2.5 py-2 text-sm tracking-wider transition-colors ${
                  active ? "bg-teal text-black" : "text-fg hover:text-teal"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div
          role="group"
          aria-label={t.nav.langSwitch}
          className="ml-auto flex overflow-hidden rounded-md border-[3px] border-black shadow-[3px_3px_0_#000]"
        >
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id)}
              aria-pressed={lang === l.id}
              title={l.full}
              className={`display min-h-[40px] min-w-[46px] px-2 text-sm tracking-wider ${
                lang === l.id ? "bg-amber text-black" : "bg-ink-3 text-fg hover:text-amber"
              }`}
            >
              <span aria-hidden>{l.label}</span>
              <span className="sr-only">{l.full}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
