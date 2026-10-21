/*
 * The Android app served from our own domain (kalkan-sigma.vercel.app/KalkanCheck-Guard.apk).
 * GitHub release links redirect to another domain, which some phones, in-app browsers
 * (Telegram, Instagram) and mobile networks fail to download.
 */
const SOURCE = "https://github.com/bekrahoon/kalkan/releases/download/android-latest/KalkanCheck-Guard.apk";
const TTL_MS = 5 * 60_000;

let cached: { at: number; body: ArrayBuffer } | null = null;

export async function GET() {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    try {
      const r = await fetch(SOURCE, { redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(15_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      cached = { at: Date.now(), body: await r.arrayBuffer() };
    } catch (e) {
      console.error("[apk]", (e as Error).message);
      if (!cached) return Response.redirect(SOURCE, 302);
    }
  }
  return new Response(cached.body, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="KalkanCheck-Guard.apk"',
      "Content-Length": String(cached.body.byteLength),
      "Cache-Control": "public, max-age=300",
    },
  });
}
