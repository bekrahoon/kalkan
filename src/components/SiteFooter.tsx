"use client";

import Link from "next/link";
import { useLang } from "./LangProvider";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        <nav className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/about" className="font-medium text-fg hover:text-primary">{t.nav.about}</Link>
          <Link href="/business" className="font-medium text-fg hover:text-primary">{t.nav.business}</Link>
          <Link href="/rights" className="font-medium text-fg hover:text-primary">{t.nav.rights}</Link>
        </nav>
        <p>{t.footer.made}</p>
        <p className="mt-1">{t.footer.note}</p>
      </div>
    </footer>
  );
}
