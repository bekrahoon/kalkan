"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";

function PanelArt({ i }: { i: number }) {
  if (i === 0)
    return (
      <svg viewBox="0 0 160 110" className="h-full w-full">
        <rect x="38" y="10" width="70" height="92" rx="4" fill="#F1F4FB" stroke="#000" strokeWidth="3" />
        {[24, 32, 40, 48, 56, 64, 72, 80].map((y, k) => (
          <rect key={y} x="46" y={y} width={k % 3 === 2 ? 36 : 54} height="3" fill="#8b95ad" />
        ))}
        <g className="scan">
          <circle cx="98" cy="58" r="20" fill="rgba(0,229,212,0.25)" stroke="#000" strokeWidth="4" />
          <circle cx="98" cy="58" r="20" fill="none" stroke="#00E5D4" strokeWidth="2" />
          <line x1="112" y1="73" x2="130" y2="92" stroke="#000" strokeWidth="9" strokeLinecap="round" />
          <line x1="112" y1="73" x2="130" y2="92" stroke="#FFB627" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    );
  if (i === 1)
    return (
      <svg viewBox="0 0 160 110" className="h-full w-full">
        <path d="M20 58 Q80 8 140 58 Q80 108 20 58 Z" fill="#F1F4FB" stroke="#000" strokeWidth="3" />
        <circle cx="80" cy="58" r="20" fill="#0B0F1A" stroke="#000" strokeWidth="3" />
        <circle cx="80" cy="58" r="9" fill="#00E5D4" className="node-pulse" />
        <g transform="translate(120 10)">
          <polygon points="16,0 32,28 0,28" fill="#FFB627" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
          <rect x="14.5" y="9" width="3" height="10" fill="#000" />
          <rect x="14.5" y="21" width="3" height="3" fill="#000" />
        </g>
      </svg>
    );
  if (i === 2)
    return (
      <svg viewBox="0 0 160 110" className="h-full w-full">
        <rect x="14" y="30" width="34" height="56" rx="6" fill="#1b2338" stroke="#000" strokeWidth="3" />
        <rect x="20" y="38" width="22" height="34" fill="#00E5D4" opacity="0.6" />
        {[22, 55, 88].map((y, k) => (
          <g key={y}>
            <path d={`M50 58 C80 58 90 ${y + 8} 112 ${y + 8}`} fill="none" stroke={k === 1 ? "#FF4458" : "#FFB627"} strokeWidth="3" strokeDasharray="5 5" />
            <rect x="114" y={y - 4} width="30" height="22" fill="#F1F4FB" stroke="#000" strokeWidth="3" />
          </g>
        ))}
      </svg>
    );
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full">
      <path d="M26 30 h36 l8 10 h64 v58 h-108 Z" fill="#FFB627" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <rect x="40" y="48" width="58" height="4" fill="#000" opacity="0.5" />
      <rect x="40" y="58" width="44" height="4" fill="#000" opacity="0.5" />
      <g transform="translate(100 46) rotate(-12)">
        <rect x="-4" y="-4" width="44" height="30" fill="none" stroke="#FF4458" strokeWidth="3" />
        <text x="18" y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FF4458" fontFamily="Oswald Variable, sans-serif">
          ДОСЬЕ
        </text>
      </g>
    </svg>
  );
}

export function LoadingComic({ onCancel }: { onCancel: () => void }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => s + 1), 850);
    return () => clearInterval(id);
  }, []);

  const caps = t.loading.captions;
  const shown = Math.min(step + 1, caps.length);
  const active = step < caps.length ? step : (step - caps.length) % caps.length;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14" aria-busy="true">
      <div className="mb-6 flex items-center gap-3">
        <ShieldLogo size={42} animated />
        <h1 className="display slant inked text-3xl text-white sm:text-4xl">{t.loading.title}</h1>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {t.loading.sr}. {caps[active]}
      </p>

      <ol className="grid grid-cols-2 gap-4 sm:gap-6" aria-hidden>
        {caps.map((c, i) => (
          <li
            key={i}
            className={`panel overflow-hidden transition-all duration-500 ${i % 2 ? "tilt-r" : "tilt-l"} ${
              i < shown ? "opacity-100" : "translate-y-6 scale-95 opacity-0"
            } ${i === active ? "!shadow-[0_0_0_3px_var(--teal),7px_7px_0_0_#000]" : ""}`}
          >
            <div className="border-b-[3px] border-black bg-amber px-2 py-1">
              <span className={`display text-[13px] text-black sm:text-sm ${i === active ? "blink-caret" : ""}`}>{c}</span>
            </div>
            <div className="aspect-[16/11] bg-[radial-gradient(circle_at_50%_60%,#18223a,#0b0f1a_75%)] p-2">
              <PanelArt i={i} />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 text-center">
        <button type="button" onClick={onCancel} className="btn btn-ghost min-h-[44px] text-sm">
          {t.loading.cancel}
        </button>
      </div>
    </section>
  );
}
