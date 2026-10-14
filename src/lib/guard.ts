import "server-only";

/*
 * Abuse protection for the shared free Gemini key (per server instance):
 * only requests from the Kalkan page itself, and per-IP limits.
 */
const hits = new Map<string, number[]>();

export function tooMany(ip: string, perMinute: number, perDay: number, bucket = "default"): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const day = (hits.get(key) ?? []).filter((t) => now - t < 86_400_000);
  const minute = day.filter((t) => now - t < 60_000);
  if (minute.length >= perMinute || day.length >= perDay) return true;
  day.push(now);
  hits.set(key, day);
  if (hits.size > 20_000) hits.clear();
  return false;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    return o.host === host || o.hostname === "localhost" || o.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
