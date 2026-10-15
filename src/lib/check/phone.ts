import "server-only";
import type { CheckResult, Lang } from "../types";
import { TX } from "./texts";

/** "0555 12-34-56", "+996 (555) 123456", "996555123456" → "+996555123456". */
export function normalizePhone(raw: string): string | null {
  const plus = raw.trim().startsWith("+");
  const d = raw.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("0")) return `+996${d.slice(1)}`;
  if (d.length === 9 && /^[2-9]/.test(d)) return `+996${d}`;
  if (d.length === 12 && d.startsWith("996")) return `+${d}`;
  if (plus && d.length >= 10 && d.length <= 15) return `+${d}`;
  if (d.length === 11 && (d.startsWith("7") || d.startsWith("8"))) return `+7${d.slice(1)}`;
  return null;
}

export function maskPhone(p: string): string {
  if (p.startsWith("+996") && p.length === 13) return `+996 ${p.slice(4, 7)} ••• ${p.slice(10)}`;
  return `${p.slice(0, p.length - 7)} ••• ${p.slice(-3)}`;
}

export const looksLikePhone = (s: string) => /^\+?[\d\s\-()]{9,20}$/.test(s.trim()) && normalizePhone(s) !== null;

/** Phone numbers inside a free text (Kyrgyz and other international formats). */
export function findPhones(text: string): string[] {
  const found = text.match(/\+\d[\d\s\-()]{8,18}\d|(?<![\d.,])(?:0|996)\d[\d\s\-()]{6,14}\d(?![\d.,])/g) ?? [];
  return [...new Set(found.map(normalizePhone).filter((p): p is string => Boolean(p)))].slice(0, 5);
}

/**
 * Kalkan deliberately keeps no database of phone numbers: a false report would brand an honest person
 * as a scammer. A bare number gets the rules that protect from phone fraud instead.
 */
export function checkPhone(raw: string, lang: Lang): CheckResult {
  const t = TX[lang];
  const phone = normalizePhone(raw)!;
  const display = maskPhone(phone);
  return {
    kind: "phone",
    verdict: "unknown",
    title: t.phoneTitleNone,
    summary: t.phoneSummaryNone,
    subject: display,
    scheme: null,
    signals: phone.startsWith("+996") ? [] : [{ level: "info", text: t.phoneForeign(phone.startsWith("+7") ? "+7" : phone.startsWith("+1") ? "+1" : phone.slice(0, 4)) }],
    advice: t.phoneAdvice,
    facts: [],
    indicators: [],
    reports: 0,
    links: [],
    lang,
  };
}
