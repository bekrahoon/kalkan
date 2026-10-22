import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison (does not leak how many characters matched). */
export function safeEqual(a: string, b: string): boolean {
  // Hash both sides so the lengths are equal and the length itself is not leaked.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

/**
 * Admin-only routes. The key is read from the `Authorization: Bearer <key>` header;
 * `?key=` still works for opening a route in a browser, but ends up in logs, so prefer the header.
 * Without ADMIN_KEY set, admin routes are disabled.
 */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_KEY?.trim();
  if (!expected || expected.length < 16) return false;
  const header = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const query = new URL(req.url).searchParams.get("key") ?? "";
  return safeEqual(header || query, expected);
}
