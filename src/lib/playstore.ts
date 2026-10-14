import "server-only";
import gplay from "google-play-scraper";
import type { Lang, PlayInfo } from "./types";

/** Extracts the app id from a Google Play link like play.google.com/store/apps/details?id=com.example. */
export function parsePlayUrl(input: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
    if (!/(^|\.)play\.google\.com$/i.test(u.hostname) || !u.pathname.startsWith("/store/apps/details")) return null;
    const id = u.searchParams.get("id");
    return id && /^[\w.]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function entries(v: unknown): { data: string; purpose: string; type: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((e) => ({ data: str(e?.data), purpose: str(e?.purpose), type: str(e?.type) }))
    .filter((e) => e.data)
    .slice(0, 40);
}

/**
 * What Google Play itself shows about the app: its "Data safety" form and the Android permissions it asks for.
 * Every part is optional — Play changes its markup often, so a failure here never breaks the analysis.
 */
export async function getPlayInfo(appId: string, lang: Lang): Promise<PlayInfo> {
  // Play has no Kyrgyz locale, so both interface languages get Russian Play texts.
  void lang;
  const hl = "ru";
  const timeout = <T,>(p: Promise<T>) =>
    Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 12_000))]);

  const [app, safety, perms] = await Promise.allSettled([
    timeout(gplay.app({ appId, lang: hl, country: "kg" })),
    timeout(gplay.datasafety({ appId, lang: hl }) as unknown as Promise<Record<string, unknown>>),
    timeout(gplay.permissions({ appId, lang: hl, short: true } as unknown as Parameters<typeof gplay.permissions>[0]) as unknown as Promise<unknown[]>),
  ]);

  const a = app.status === "fulfilled" ? (app.value as unknown as Record<string, unknown>) : {};
  const s = safety.status === "fulfilled" ? safety.value : {};
  const p = perms.status === "fulfilled" && Array.isArray(perms.value) ? perms.value : [];

  return {
    appId,
    title: str(a.title),
    developer: str(a.developer),
    privacyPolicyUrl: str(s.privacyPolicyUrl) || str(a.privacyPolicy),
    shared: entries(s.sharedData),
    collected: entries(s.collectedData),
    security: Array.isArray(s.securityPractices)
      ? (s.securityPractices as Record<string, unknown>[]).map((x) => str(x?.practice)).filter(Boolean).slice(0, 10)
      : [],
    permissions: [
      ...new Set(
        p.map((x) => (typeof x === "string" ? x : str((x as Record<string, unknown>)?.permission))).filter(Boolean),
      ),
    ].slice(0, 40),
    available: app.status === "fulfilled" || safety.status === "fulfilled" || perms.status === "fulfilled",
  };
}
