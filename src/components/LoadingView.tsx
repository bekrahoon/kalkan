"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";

export function LoadingView({ onCancel }: { onCancel: () => void }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const caps = t.loading.captions;

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, caps.length - 1)), 800);
    return () => clearInterval(id);
  }, [caps.length]);

  return (
    <section className="mx-auto max-w-md px-4 py-14" aria-busy="true">
      <div className="card fade-in p-6 text-center sm:p-8">
        <ShieldLogo size={56} animated className="mx-auto" />
        <h1 className="mt-4 text-xl font-bold">{t.loading.title}</h1>
        <p role="status" aria-live="polite" className="sr-only">
          {t.loading.sr}. {caps[step]}
        </p>

        <ol className="mt-6 space-y-3 text-left" aria-hidden>
          {caps.map((c, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={i} className={`flex items-center gap-3 text-sm transition-opacity ${i > step ? "opacity-40" : ""}`}>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    done ? "bg-primary text-on-primary" : active ? "bg-primary-soft text-primary" : "bg-subtle text-muted"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="spin h-4 w-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                </span>
                <span className={active ? "font-semibold" : "text-muted"}>{c}</span>
              </li>
            );
          })}
        </ol>

        <button type="button" onClick={onCancel} className="btn btn-secondary mt-8 w-full">
          {t.loading.cancel}
        </button>
      </div>
    </section>
  );
}
