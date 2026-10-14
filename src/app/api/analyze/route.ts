import { createHash } from "node:crypto";
import { getDemoReport, isDemoId, DEMO_TEXTS } from "@/lib/demo";
import { AnalyzeError, analyzeWithGemini } from "@/lib/gemini";
import { normalizeReport } from "@/lib/normalize";
import { runAnalysis, type AnalysisInput } from "@/lib/pipeline";
import { clientIp, sameOrigin, tooMany } from "@/lib/guard";
import {
  FILE_MIMES,
  MAX_FILE_BYTES,
  type AnalyzeMeta,
  type AnalyzeResponse,
  type ErrorCode,
  type Lang,
  type Report,
} from "@/lib/types";

/** Gemini can be slow at peak times; Vercel Hobby with Fluid compute allows up to 300 s. */
export const maxDuration = 300;

const MIN_POLICY_CHARS = 200;
/** Room for a 3 MB file as base64 (~4 MB of JSON). */
const MAX_BODY_CHARS = 4_300_000;

const PER_MINUTE = 6;
const PER_DAY = Number(process.env.DAILY_LIMIT_PER_IP || 40);

/* Same input + language → same report for a day, without spending the AI quota again.
   In-memory per server instance: on Vercel it survives warm invocations, which is what demos hit. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; report: Report; meta: AnalyzeMeta }>();
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
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

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("bad_request", 403);

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
  const forChild = body.forChild === true;
  if (demoId) return runDemo(demoId, lang);

  // Validate and build the input.
  let input: AnalysisInput;
  if (body.mode === "url") {
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) return fail("invalid_url", 400);
    input = { kind: "url", url };
  } else if (body.mode === "file") {
    const f = (body.file ?? {}) as Record<string, unknown>;
    const mime = typeof f.mime === "string" ? f.mime.toLowerCase() : "";
    const data = typeof f.data === "string" ? f.data.replace(/^data:[^,]*,/, "") : "";
    if (!(FILE_MIMES as readonly string[]).includes(mime) || !data) return fail("file_type", 415);
    if (Math.floor((data.length * 3) / 4) > MAX_FILE_BYTES) return fail("file_too_big", 413);
    input = { kind: "file", mime, data };
  } else {
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (text.length < MIN_POLICY_CHARS) return fail("text_too_short", 400);
    input = { kind: "text", text };
  }

  // Cache lookup before the rate limit: repeated checks of the same thing cost nothing.
  const key = sha(
    [lang, forChild ? "child" : "adult", input.kind, input.kind === "url" ? input.url.toLowerCase() : input.kind === "file" ? sha(input.data) : input.text].join("\u0000"),
  );
  const hit = cacheGet(key);
  if (hit) return Response.json({ ok: true, report: hit.report, meta: { ...hit.meta, cached: true } } satisfies AnalyzeResponse);

  if (tooMany(clientIp(req), PER_MINUTE, PER_DAY, "analyze")) return fail("too_many_requests", 429);

  try {
    const { report, meta } = await runAnalysis(input, lang, forChild);
    cacheSet(key, report, meta);
    return Response.json({ ok: true, report, meta } satisfies AnalyzeResponse);
  } catch (e) {
    if (e instanceof AnalyzeError) return fail(e.code, e.status);
    console.error("[analyze]", e);
    return fail("ai_failed", 502);
  }
}

/** Demo buttons: live analysis of the sample text, falling back to the prepared report so the demo never breaks. */
async function runDemo(demoId: Parameters<typeof getDemoReport>[0], lang: Lang) {
  const text = DEMO_TEXTS[demoId];
  const fallback = (code: ErrorCode) =>
    Response.json({
      ok: true,
      report: getDemoReport(demoId, lang),
      meta: { source: "demo-cache", truncated: false, originalChars: text.length, analyzedChars: text.length, fallbackReason: code },
    } satisfies AnalyzeResponse);

  // DEMO_CACHE_ONLY=1 makes demo buttons instant and offline-proof (handy on stage).
  if (process.env.DEMO_CACHE_ONLY === "1") return fallback("ai_failed");
  const key = `demo:${demoId}:${lang}`;
  const hit = cacheGet(key);
  if (hit) return Response.json({ ok: true, report: hit.report, meta: { ...hit.meta, cached: true } } satisfies AnalyzeResponse);
  try {
    const { json, model } = await analyzeWithGemini({ text }, lang);
    const report = normalizeReport(json, lang, text);
    const meta: AnalyzeMeta = { source: "live", truncated: false, originalChars: text.length, analyzedChars: text.length, model };
    cacheSet(key, report, meta);
    return Response.json({ ok: true, report, meta } satisfies AnalyzeResponse);
  } catch (e) {
    return fallback(e instanceof AnalyzeError ? e.code : "ai_failed");
  }
}
