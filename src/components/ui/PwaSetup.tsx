"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useLang } from "@/components/providers/LangProvider";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const DISMISS_KEY = "kalkan-install-dismissed";

/** Registers the service worker and offers "Install KalkanCheck" (Android/desktop) or an iPhone hint. */
const STATIC_DEMO = process.env.NEXT_PUBLIC_KALKAN_STATIC === "1";

export function InstallCard() {
  return STATIC_DEMO ? null : <InstallCardInner />;
}

function InstallCardInner() {
  const { t } = useLang();
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (dismissed || standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const timer = isIos
      ? setTimeout(() => {
          setIos(true);
          setHidden(false);
        }, 0)
      : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="card fade-in mt-6 flex gap-3 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon, same file the installed app uses */}
      <img src="/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t.install.title}</p>
        <p className="mt-0.5 text-sm leading-snug text-muted">{ios ? t.install.iosText : t.install.text}</p>
        {evt && (
          <button
            type="button"
            onClick={async () => {
              await evt.prompt();
              await evt.userChoice.catch(() => null);
              setHidden(true);
            }}
            className="btn btn-primary mt-3 min-h-[40px] px-4 text-sm"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t.install.button}
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label={t.install.close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-subtle">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
