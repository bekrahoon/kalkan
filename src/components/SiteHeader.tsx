"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  ChevronRight,
  HeartHandshake,
  Info,
  LifeBuoy,
  Menu,
  Search,
  Send,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";
import { BOT_URL } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const LANGS: { id: Lang; label: string; full: string }[] = [
  { id: "ru", label: "RU", full: "Русский" },
  { id: "ky", label: "KG", full: "Кыргызча" },
  { id: "en", label: "EN", full: "English" },
];

type Item = {
  href: string;
  key: "check" | "protect" | "schemes" | "help" | "about" | "bot";
  icon: LucideIcon;
  external?: boolean;
};

const ITEMS: Item[] = [
  { href: "/", key: "check", icon: Search },
  { href: "/protect", key: "protect", icon: HeartHandshake },
  { href: "/schemes", key: "schemes", icon: BookOpen },
  { href: "/help", key: "help", icon: LifeBuoy },
  { href: "/about", key: "about", icon: Info },
  { href: BOT_URL, key: "bot", icon: Send, external: true },
];

/** Desktop shows the main links inline; on phones everything lives in one burger menu. */
const DESKTOP: Item["key"][] = ["check", "protect", "schemes", "help"];

function LangSwitch({ big = false }: { big?: boolean }) {
  const { t, lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label={t.nav.langSwitch}
      className={`flex rounded-lg bg-subtle p-1 ${big ? "w-full" : ""}`}
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          title={l.full}
          className={`rounded-md px-2 text-sm font-semibold transition-colors ${big ? "min-h-[44px] flex-1" : "min-h-[34px] min-w-[42px]"} ${
            lang === l.id
              ? "bg-surface text-fg shadow-sm"
              : "text-muted hover:text-fg"
          }`}
        >
          {big ? l.full : <span aria-hidden>{l.label}</span>}
          {!big && <span className="sr-only">{l.full}</span>}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const { t } = useLang();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(path);
  const closeRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const isActive = (i: Item) =>
    !i.external && (i.href === "/" ? path === "/" : path.startsWith(i.href));

  // Navigating to another page closes the menu.
  if (open && openedAt !== path) {
    setOpen(false);
    setOpenedAt(path);
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const burger = burgerRef.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      burger?.focus();
    };
  }, [open]);

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="KalkanCheck"
        >
          <ShieldLogo size={26} />
          <span className="text-lg font-bold tracking-tight">KalkanCheck</span>
        </Link>

        <nav aria-label={t.nav.menu} className="hidden gap-1 md:flex">
          {ITEMS.filter((i) => DESKTOP.includes(i.key)).map((i) => (
            <Link
              key={i.key}
              href={i.href}
              aria-current={isActive(i) ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(i)
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:text-fg"
              }`}
            >
              {t.nav[i.key]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden md:block">
          <LangSwitch />
        </div>

        <button
          ref={burgerRef}
          type="button"
          onClick={() => {
            setOpenedAt(path);
            setOpen(true);
          }}
          aria-expanded={open}
          aria-controls="site-menu"
          className="ml-auto flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:border-primary md:ml-0"
        >
          <Menu className="h-5 w-5" aria-hidden />
          <span>{t.nav.menu}</span>
        </button>
      </div>

      {/* Portal: the sticky header's backdrop-blur would otherwise trap the fixed menu inside it. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50" id="site-menu">
            <button
              type="button"
              aria-label={t.nav.close}
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="menu-backdrop absolute inset-0 bg-black/40"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.menu}
              className="menu-panel absolute inset-y-0 right-0 flex w-[min(24rem,100%)] flex-col bg-bg shadow-2xl"
            >
              <div className="flex items-center gap-2 border-b border-line bg-surface px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
                <ShieldLogo size={24} />
                <span className="text-lg font-bold">KalkanCheck</span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.nav.close}
                  className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl hover:bg-subtle"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <nav
                aria-label={t.nav.menu}
                className="flex-1 overflow-y-auto p-3"
              >
                <ul className="space-y-1">
                  {ITEMS.map((i) => {
                    const Icon = i.icon;
                    const active = isActive(i);
                    const inner = (
                      <>
                        <span
                          className={`icon-badge shrink-0 ${active ? "bg-primary text-on-primary" : "bg-primary-soft text-primary"}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {t.nav[i.key]}
                          </span>
                          <span className="block text-sm leading-snug text-muted">
                            {t.nav.desc[i.key]}
                          </span>
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-muted"
                          aria-hidden
                        />
                      </>
                    );
                    const cls = `flex min-h-[64px] items-center gap-3 rounded-2xl px-3 py-2 transition-colors ${
                      active ? "bg-primary-soft" : "hover:bg-subtle"
                    }`;
                    return (
                      <li key={i.key}>
                        {i.external ? (
                          <a
                            href={i.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cls}
                            onClick={() => setOpen(false)}
                          >
                            {inner}
                          </a>
                        ) : (
                          <Link
                            href={i.href}
                            aria-current={active ? "page" : undefined}
                            className={cls}
                            onClick={() => setOpen(false)}
                          >
                            {inner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
                <p className="mb-2 text-sm font-medium text-muted">
                  {t.nav.langSwitch}
                </p>
                <LangSwitch big />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
