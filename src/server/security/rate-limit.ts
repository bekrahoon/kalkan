import "server-only";

/*
 * Simple sliding-window limits per key (IP, chat, …).
 * Kept in memory of one server instance: good against a single abuser, not a distributed attack.
 * For that, Vercel Firewall rate-limit rules sit in front of the app.
 */
const hits = new Map<string, number[]>();
const MAX_KEYS = 20_000;

export function tooMany(key: string, perMinute: number, perDay: number, bucket = "default"): boolean {
  const k = `${bucket}:${key}`;
  const now = Date.now();
  const day = (hits.get(k) ?? []).filter((t) => now - t < 86_400_000);
  const minute = day.filter((t) => now - t < 60_000);
  if (minute.length >= perMinute || day.length >= perDay) return true;
  day.push(now);
  hits.set(k, day);
  if (hits.size > MAX_KEYS) hits.clear();
  return false;
}
