"use client";

import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { BOT_URL } from "@/lib/i18n";
import { CONSENT } from "@/content/legal";

export function SiteFooter() {
  const { t, lang } = useLang();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        <nav className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/about" className="font-medium text-fg hover:text-primary">{t.nav.about}</Link>
          <Link href="/protect" className="font-medium text-fg hover:text-primary">{t.nav.protect}</Link>
          <Link href="/schemes" className="font-medium text-fg hover:text-primary">{t.nav.schemes}</Link>
          <Link href="/help" className="font-medium text-fg hover:text-primary">{t.nav.help}</Link>
          <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-fg hover:text-primary">{t.footer.bot}</a>
        </nav>
        <nav className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/privacy" className="hover:text-primary">{CONSENT[lang].privacy}</Link>
          <Link href="/terms" className="hover:text-primary">{CONSENT[lang].terms}</Link>
        </nav>
        <p>{t.footer.made}</p>
        <p className="mt-1">{t.footer.note}</p>
      </div>
    </footer>
  );
}
