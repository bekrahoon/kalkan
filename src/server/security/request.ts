import "server-only";

/**
 * The visitor's IP. On Vercel the platform sets these headers itself (a client cannot forge them);
 * the leftmost x-forwarded-for entry is only a fallback for local runs.
 */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

/** Only requests made by the KalkanCheck page itself (blocks other sites from using our API and AI quota). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    return o.host === host || (process.env.NODE_ENV !== "production" && (o.hostname === "localhost" || o.hostname === "127.0.0.1"));
  } catch {
    return false;
  }
}
