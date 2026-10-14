"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { RiskLevel } from "@/lib/types";

export const LEVEL_COLOR: Record<RiskLevel, string> = {
  low: "var(--primary)",
  medium: "var(--warn)",
  high: "var(--danger)",
};

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
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1100);
      setValue(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, reduced]);

  const shown = reduced ? score : value;
  const len = Math.PI * 80;
  const color = LEVEL_COLOR[level];

  return (
    <div className="relative w-full max-w-[240px]">
      <svg
        viewBox="0 0 200 112"
        className="w-full"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={label}
      >
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--subtle)" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - shown / 100)}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="text-5xl font-bold tabular-nums" style={{ color }}>
          {shown}
        </span>
        <span className="ml-1 text-sm text-muted">{of100}</span>
      </div>
    </div>
  );
}
