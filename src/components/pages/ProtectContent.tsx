"use client";

import { Download, HeartHandshake, Send, Users, type LucideIcon } from "lucide-react";
import { useLang } from "@/components/providers/LangProvider";
import { BOT_URL, FAMILY_URL, GROUP_URL } from "@/lib/i18n";

type Option = {
  icon: LucideIcon;
  title: string;
  text: string;
  button: string;
  href: string;
  download?: boolean;
  note?: string;
  best?: boolean;
};

/** All the "protect your family" options on one page instead of the home screen. */
export function ProtectContent() {
  const { t } = useLang();
  const options: Option[] = [
    { icon: HeartHandshake, title: t.family.title, text: t.family.text, button: t.family.button, href: FAMILY_URL, best: true },
    { icon: Users, title: t.group.title, text: t.group.text, button: t.group.button, href: GROUP_URL },
    { icon: Send, title: t.bot.title, text: t.bot.text, button: t.bot.button, href: BOT_URL },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="eyebrow">{t.protect.kicker}</p>
      <h1 className="mt-2 text-[clamp(1.9rem,7vw,2.6rem)] font-bold leading-tight">{t.protect.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{t.protect.lead}</p>

      <ol className="mt-8 space-y-3">
        {options.map((o, i) => {
          const Icon = o.icon;
          return (
            <li key={o.title} className={`card p-5 ${o.best ? "border-primary ring-1 ring-primary" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`icon-badge shrink-0 ${o.best ? "bg-primary text-on-primary" : "bg-primary-soft text-primary"}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  {o.best && (
                    <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-on-primary">{t.protect.best}</span>
                  )}
                  <h2 className="text-lg font-bold leading-snug">
                    <span className="sr-only">{i + 1}. </span>
                    {o.title}
                  </h2>
                  <p className="mt-1 leading-relaxed text-muted">{o.text}</p>
                </div>
              </div>
              <a
                href={o.href}
                {...(o.download ? { download: true } : { target: "_blank", rel: "noopener noreferrer" })}
                className={`btn mt-4 w-full sm:w-auto ${o.best ? "btn-primary" : "btn-secondary"}`}
              >
                {o.download ? <Download className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />} {o.button}
              </a>
              {o.note && <p className="mt-2 text-xs text-muted">{o.note}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
