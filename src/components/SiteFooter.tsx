"use client";

import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t-[3px] border-black bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-6 text-sm text-muted">
        <ShieldLogo size={22} />
        <div>
          <p>{t.footer.made}</p>
          <p className="mt-1">{t.footer.note}</p>
        </div>
      </div>
    </footer>
  );
}
