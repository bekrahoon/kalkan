import "server-only";
import { reportCount } from "../reports";
import type { CheckResult, Indicator, Lang } from "../types";
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

export function phoneIndicator(p: string): Indicator {
  return { type: "phone", value: p, display: maskPhone(p) };
}

export async function checkPhone(raw: string, lang: Lang): Promise<CheckResult> {
  const t = TX[lang];
  const phone = normalizePhone(raw)!;
  const indicator = phoneIndicator(phone);
  const reports = await reportCount([indicator]);
  const signals: CheckResult["signals"] = [];
  if (reports >= 3) signals.push({ level: "bad", text: t.reportsMany(reports) });
  else if (reports > 0) signals.push({ level: "warn", text: t.reportsFew(reports) });
  else signals.push({ level: "info", text: t.phoneNoReports });
  if (!phone.startsWith("+996")) signals.push({ level: "info", text: t.phoneForeign(phone.startsWith("+7") ? "+7" : phone.startsWith("+1") ? "+1" : phone.slice(0, 4)) });

  const verdict = reports >= 3 ? "danger" : reports > 0 ? "suspicious" : "unknown";
  return {
    kind: "phone",
    verdict,
    title: verdict === "unknown" ? t.phoneTitleNone : t.titles[verdict],
    summary: verdict === "unknown" ? t.phoneSummaryNone : t.phoneSummaryReported(reports),
    subject: indicator.display,
    scheme: null,
    signals,
    advice: t.advice[verdict === "unknown" ? "suspicious" : verdict],
    facts: [{ label: t.f.phone, value: indicator.display }],
    indicators: [indicator],
    reports,
    links: [],
    lang,
  };
}
