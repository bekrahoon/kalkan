"use client";

import { useLang } from "./LangProvider";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        <p>{t.footer.made}</p>
        <p className="mt-1">{t.footer.note}</p>
      </div>
    </footer>
  );
}
