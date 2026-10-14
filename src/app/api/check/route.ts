import { CheckError } from "@/lib/ai";
import { runCheck } from "@/lib/check";
import { getDemoResult, isDemoId } from "@/lib/demo";
import { clientIp, sameOrigin, tooMany } from "@/lib/guard";
import { IMAGE_MIMES, MAX_FILE_BYTES, MAX_TEXT_CHARS, type CheckResponse, type ErrorCode, type Lang } from "@/lib/types";

/** A check takes a few seconds; the ceiling is for slow sites and a busy AI. */
export const maxDuration = 60;

const MAX_BODY_CHARS = 4_300_000;
const PER_MINUTE = 10;
const PER_DAY = Number(process.env.DAILY_LIMIT_PER_IP || 80);

function fail(code: ErrorCode, status: number) {
  return Response.json({ ok: false, error: { code, status } } satisfies CheckResponse, { status });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("bad_request", 403);
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) return fail("file_too_big", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("bad_request", 400);
  }
  const lang: Lang = body.lang === "ky" ? "ky" : "ru";
  if (isDemoId(body.demoId)) return Response.json({ ok: true, result: getDemoResult(body.demoId, lang) } satisfies CheckResponse);

  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT_CHARS) : "";
  let image: { mime: string; data: string } | null = null;
  if (body.image && typeof body.image === "object") {
    const f = body.image as Record<string, unknown>;
    const mime = typeof f.mime === "string" ? f.mime.toLowerCase() : "";
    const data = typeof f.data === "string" ? f.data.replace(/^data:[^,]*,/, "") : "";
    if (!(IMAGE_MIMES as readonly string[]).includes(mime) || !data) return fail("file_type", 415);
    if (Math.floor((data.length * 3) / 4) > MAX_FILE_BYTES) return fail("file_too_big", 413);
    image = { mime, data };
  }
  if (!text && !image) return fail("empty", 400);
  if (tooMany(clientIp(req), PER_MINUTE, PER_DAY, "check")) return fail("too_many_requests", 429);

  try {
    const result = await runCheck({ text, image }, lang);
    return Response.json({ ok: true, result } satisfies CheckResponse);
  } catch (e) {
    if (e instanceof CheckError) return fail(e.code, e.status);
    console.error("[check]", e);
    return fail("ai_failed", 502);
  }
}
