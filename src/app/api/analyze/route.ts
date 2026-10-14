import { getDemoReport, isDemoId, DEMO_TEXTS } from "@/lib/demo";
import { fetchPolicyText } from "@/lib/extract";
import { AnalyzeError, analyzeWithGemini, type PolicyInput } from "@/lib/gemini";
import { normalizeReport } from "@/lib/normalize";
import { getPlayInfo, parsePlayUrl } from "@/lib/playstore";
import { createHash } from "node:crypto";
import {
  FILE_MIMES,
  MAX_FILE_BYTES,
  type AnalyzeMeta,
  type AnalyzeResponse,
  type ErrorCode,
  type Lang,
  type PlayInfo,
  type Report,
} from "@/lib/types";

export const maxDuration = 60;

/**
 * ~50–60k tokens. Gemini Flash reads far more, but this keeps one request inside free-tier
 * per-minute limits while covering practically every real privacy policy in full.
 */
const MAX_POLICY_CHARS = 200_000;
const MIN_POLICY_CHARS = 200;
/** Room for a 3 MB file as base64 (~4 MB of JSON). */
const MAX_BODY_CHARS = 4_300_000;

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

/* Same input + language → same report for a day, without spending the AI quota again.
   In-memory per server instance: on Vercel it survives warm invocations, which is what demos hit. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; report: Report; meta: AnalyzeMeta }>();
function cacheKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}
function cacheGet(key: string) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, hit); // refresh LRU position
  return hit;
}
function cacheSet(key: string, report: Report, meta: AnalyzeMeta) {
  cache.set(key, { at: Date.now(), report, meta });
  while (cache.size > 300) cache.delete(cache.keys().next().value!);
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
  const mode = body.mode === "url" || body.mode === "file" ? body.mode : "text";

  // Cache lookup before the rate limit: repeated checks of the same thing cost nothing.
  const fileData = mode === "file" && body.file && typeof (body.file as Record<string, unknown>).data === "string"
    ? String((body.file as Record<string, unknown>).data)
    : "";
  const key = demoId
    ? null
    : cacheKey([lang, mode, mode === "url" ? String(body.url ?? "").trim().toLowerCase() : mode === "file" ? createHash("sha256").update(fileData).digest("hex") : String(body.text ?? "").trim()]);
  const hit = key ? cacheGet(key) : null;
  if (hit) return Response.json({ ok: true, report: hit.report, meta: { ...hit.meta, cached: true } } satisfies AnalyzeResponse);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!demoId && tooMany(ip)) return fail("too_many_requests", 429);

  let policy = "";
  let fileInput: PolicyInput | null = null;
  let sourceUrl: string | undefined;
  let play: PlayInfo | undefined;

  try {
    if (demoId) {
      policy = DEMO_TEXTS[demoId];
    } else if (mode === "url") {
      const url = typeof body.url === "string" ? body.url : "";
      if (!url.trim()) return fail("invalid_url", 400);
      let policyUrl = url;
      // A Google Play link: take Play's own data-safety info + permissions, then read the app's policy.
      const appId = parsePlayUrl(url);
      if (appId) {
        play = await getPlayInfo(appId, lang);
        if (!play.privacyPolicyUrl) return fail("play_no_policy", 422);
        policyUrl = play.privacyPolicyUrl;
      }
      const fetched = await fetchPolicyText(policyUrl);
      sourceUrl = fetched.url;
      if ("pdf" in fetched) fileInput = { mime: "application/pdf", data: fetched.pdf };
      else policy = fetched.text;
    } else if (mode === "file") {
      const f = (body.file ?? {}) as Record<string, unknown>;
      const mime = typeof f.mime === "string" ? f.mime.toLowerCase() : "";
      const data = typeof f.data === "string" ? f.data.replace(/^data:[^,]*,/, "") : "";
      if (!(FILE_MIMES as readonly string[]).includes(mime) || !data) return fail("file_type", 415);
      if (Math.floor((data.length * 3) / 4) > MAX_FILE_BYTES) return fail("file_too_big", 413);
      fileInput = { mime, data };
    } else {
      policy = typeof body.text === "string" ? body.text.trim() : "";
      if (policy.length < MIN_POLICY_CHARS) return fail("text_too_short", 400);
    }
  } catch (e) {
    if (e instanceof AnalyzeError) {
      console.warn(`[analyze] fetch stage: ${e.code}`, mode === "url" ? String(body.url ?? "").slice(0, 200) : mode);
      return fail(e.code, e.status);
    }
    console.error("[analyze] fetch stage", e);
    return fail("fetch_failed", 502);
  }

  const originalChars = policy.length;
  const { text, truncated } = truncate(policy);

  try {
    // DEMO_CACHE_ONLY=1 makes demo buttons instant and offline-proof (handy on stage).
    if (demoId && process.env.DEMO_CACHE_ONLY === "1") throw new AnalyzeError("ai_failed", 200);
    const { json, model } = await analyzeWithGemini(fileInput ?? { text }, lang);
    // Quotes can only be checked against text we extracted ourselves, not against a PDF/photo.
    const report = normalizeReport(json, lang, fileInput ? undefined : text);
    const meta: AnalyzeMeta = {
      source: "live",
      truncated: fileInput ? false : truncated,
      originalChars,
      analyzedChars: text.length,
      sourceUrl,
      model,
      play,
    };
    if (key) cacheSet(key, report, meta);
    return Response.json({ ok: true, report, meta } satisfies AnalyzeResponse);
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
