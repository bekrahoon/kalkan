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
    { href: "/schemes", label: t.nav.schemes },
    { href: "/help", label: t.nav.help },
  ];

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2" aria-label="Калкан">
          <ShieldLogo size={26} />
          <span className="text-lg font-bold tracking-tight">Калкан</span>
        </Link>

        <nav aria-label={t.nav.menu} className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary-soft text-primary" : "text-muted hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div role="group" aria-label={t.nav.langSwitch} className="ml-auto flex rounded-lg bg-subtle p-1">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id)}
              aria-pressed={lang === l.id}
              title={l.full}
              className={`min-h-[34px] min-w-[42px] rounded-md px-2 text-sm font-semibold transition-colors ${
                lang === l.id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
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
