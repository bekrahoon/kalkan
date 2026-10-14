"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { RiskLevel } from "@/lib/types";

const COLOR: Record<RiskLevel, string> = { low: "#00E5D4", medium: "#FFB627", high: "#FF4458" };

const RM = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(RM);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(RM).matches,
    () => false,
  );
}

/** Semicircle meter that fills up and counts to the score. */
export function RiskGauge({ score, level, label, of100 }: { score: number; level: RiskLevel; label: string; of100: string }) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => (raf = requestAnimationFrame(tick)), 250);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [score, reduced]);

  const shownValue = reduced ? score : value;
  const R = 80;
  const len = Math.PI * R;
  const offset = len * (1 - shownValue / 100);
  const angle = -90 + (shownValue / 100) * 180;

  return (
    <div className="relative w-full max-w-[280px]">
      <svg
        viewBox="0 0 200 120"
        className="w-full"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={label}
      >
        <defs>
          <linearGradient id="gauge-track" x1="0" x2="1">
            <stop offset="0" stopColor="#00E5D4" />
            <stop offset="0.5" stopColor="#FFB627" />
            <stop offset="1" stopColor="#FF4458" />
          </linearGradient>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#000" strokeWidth="26" strokeLinecap="round" />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gauge-track)" strokeOpacity="0.18" strokeWidth="18" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={COLOR[level]}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={offset}
        />
        {[0, 25, 50, 75, 100].map((tk) => {
          const a = ((-180 + (tk / 100) * 180) * Math.PI) / 180;
          return (
            <line
              key={tk}
              x1={100 + Math.cos(a) * 58}
              y1={100 + Math.sin(a) * 58}
              x2={100 + Math.cos(a) * 64}
              y2={100 + Math.sin(a) * 64}
              stroke="#5d6880"
              strokeWidth="2"
            />
          );
        })}
        <g transform={`rotate(${angle} 100 100)`}>
          <polygon points="96,100 104,100 100,40" fill="#E9EEF8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <circle cx="100" cy="100" r="9" fill="#0B0F1A" stroke="#E9EEF8" strokeWidth="3" />
      </svg>
      <div className="-mt-3 text-center">
        <span className="display inked text-6xl text-white" style={{ color: COLOR[level] }}>
          {shownValue}
        </span>
        <span className="ml-1 text-sm font-semibold text-muted">{of100}</span>
      </div>
    </div>
  );
}

/** Comic sound-effect burst ("БАМ!"). */
export function SfxBurst({ text, level }: { text: string; level: RiskLevel }) {
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? 34 : 50;
    const a = (i / (n * 2)) * Math.PI * 2;
    pts.push(`${60 + Math.cos(a) * r},${50 + Math.sin(a) * r * 0.82}`);
  }
  const fill = level === "low" ? "#00E5D4" : "#FFB627";
  return (
    <div className="pop-in pointer-events-none select-none" aria-hidden>
      <svg viewBox="0 0 120 100" className="h-24 w-28 -rotate-12 drop-shadow-[4px_4px_0_#000] sm:h-28 sm:w-32">
        <polygon points={pts.join(" ")} fill={fill} stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
        <text
          x="60"
          y="59"
          textAnchor="middle"
          fontFamily="Oswald Variable, sans-serif"
          fontWeight="700"
          fontSize={text.length > 4 ? 21 : 26}
          fill={level === "high" ? "#FF4458" : "#000"}
          stroke="#000"
          strokeWidth={level === "high" ? 1.6 : 0}
          paintOrder="stroke"
          transform="skewX(-8)"
          style={{ transformOrigin: "60px 50px" }}
        >
          {text}
        </text>
      </svg>
    </div>
  );
}
