import { getDemoReport, isDemoId, DEMO_TEXTS } from "@/lib/demo";
import { fetchPolicyText } from "@/lib/extract";
import { AnalyzeError, analyzeWithGemini } from "@/lib/gemini";
import { normalizeReport } from "@/lib/normalize";
import type { AnalyzeResponse, ErrorCode, Lang } from "@/lib/types";

export const maxDuration = 60;

/** ~15–20k tokens: comfortably inside free-tier limits and enough for almost any policy. */
const MAX_POLICY_CHARS = 60_000;
const MIN_POLICY_CHARS = 200;
const MAX_BODY_CHARS = 400_000;

/* Light per-instance rate limit so one visitor can't burn the shared free quota. */
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
}

function fail(code: ErrorCode, status: number) {
  return Response.json({ ok: false, error: { code, status } } satisfies AnalyzeResponse, { status });
}

/** Cut at a paragraph/sentence boundary near the limit rather than mid-word. */
function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_POLICY_CHARS) return { text, truncated: false };
  const slice = text.slice(0, MAX_POLICY_CHARS);
  const cut = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
  return { text: cut > MAX_POLICY_CHARS * 0.8 ? slice.slice(0, cut + 1) : slice, truncated: true };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) return fail("bad_request", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("bad_request", 400);
  }

  const lang: Lang = body.lang === "ky" ? "ky" : "ru";
  const demoId = isDemoId(body.demoId) ? body.demoId : undefined;
  const mode = body.mode === "url" ? "url" : "text";

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!demoId && tooMany(ip)) return fail("too_many_requests", 429);

  let policy = "";
  let sourceUrl: string | undefined;

  try {
    if (demoId) {
      policy = DEMO_TEXTS[demoId];
    } else if (mode === "url") {
      const url = typeof body.url === "string" ? body.url : "";
      if (!url.trim()) return fail("invalid_url", 400);
      const fetched = await fetchPolicyText(url);
      policy = fetched.text;
      sourceUrl = fetched.url;
    } else {
      policy = typeof body.text === "string" ? body.text.trim() : "";
      if (policy.length < MIN_POLICY_CHARS) return fail("text_too_short", 400);
    }
  } catch (e) {
    if (e instanceof AnalyzeError) return fail(e.code, e.status);
    console.error("[analyze] fetch stage", e);
    return fail("fetch_failed", 502);
  }

  const originalChars = policy.length;
  const { text, truncated } = truncate(policy);

  try {
    // DEMO_CACHE_ONLY=1 makes demo buttons instant and offline-proof (handy on stage).
    if (demoId && process.env.DEMO_CACHE_ONLY === "1") throw new AnalyzeError("ai_failed", 200);
    const { json, model } = await analyzeWithGemini(text, lang);
    const report = normalizeReport(json, lang, text);
    return Response.json({
      ok: true,
      report,
      meta: { source: "live", truncated, originalChars, analyzedChars: text.length, sourceUrl, model },
    } satisfies AnalyzeResponse);
  } catch (e) {
    const code: ErrorCode = e instanceof AnalyzeError ? e.code : "ai_failed";
    const status = e instanceof AnalyzeError ? e.status : 502;
    if (!(e instanceof AnalyzeError)) console.error("[analyze] ai stage", e);

    // Demo must never break in front of the jury: fall back to the prepared report.
    if (demoId) {
      return Response.json({
        ok: true,
        report: getDemoReport(demoId, lang),
        meta: {
          source: "demo-cache",
          truncated: false,
          originalChars,
          analyzedChars: originalChars,
          fallbackReason: code,
        },
      } satisfies AnalyzeResponse);
    }
    return fail(code, status);
  }
}
