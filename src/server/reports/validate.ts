import "server-only";
import { parse as parseDomain } from "tldts";
import { BRANDS, KNOWN_DOMAINS } from "@/server/check/official";
import type { Indicator } from "@/lib/types";

/**
 * Re-validates indicators coming from a client or the bot: only real domains and app ids (no phone numbers: we never label people),
 * and never official or well-known sites (so nobody can "report" mbank.kg into a warning).
 */
export function reportableIndicators(raw: unknown): Indicator[] {
  if (!Array.isArray(raw)) return [];
  const out: Indicator[] = [];
  for (const x of raw.slice(0, 4)) {
    const type = x?.type;
    const original = typeof x?.value === "string" ? x.value.trim() : "";
    const value = original.toLowerCase();
    if (type === "domain") {
      const p = parseDomain(value, { allowPrivateDomains: true });
      const icann = parseDomain(value).domain ?? "";
      if (!p.domain || p.domain !== value) continue;
      if (KNOWN_DOMAINS.has(icann) || BRANDS.some((b) => b.domains.includes(icann)) || value.endsWith("gov.kg")) continue;
      out.push({ type, value, display: value });
    } else if (type === "app" && /^[a-z][\w]*(\.[\w]+)+$/i.test(original)) {
      out.push({ type, value: original, display: typeof x?.display === "string" ? x.display.slice(0, 80) : value });
    }
  }
  return out;
}
