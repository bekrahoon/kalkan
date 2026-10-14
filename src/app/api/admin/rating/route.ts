import gplay from "google-play-scraper";
import { AnalyzeError, translateReportWithGemini } from "@/lib/gemini";
import { mergeTranslation, normalizeReport } from "@/lib/normalize";
import { runAnalysis } from "@/lib/pipeline";
import { RATING_SERVICES } from "@/content/rating-services";
import type { Lang } from "@/lib/types";

export const maxDuration = 300;

/**
 * Maintenance endpoint that (re)builds one entry of the rating:
 *   GET /api/admin/rating?key=ADMIN_KEY&id=telegram&lang=ru
 * Protected by the ADMIN_KEY environment variable; disabled when it is not set.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || u.searchParams.get("key") !== adminKey) return new Response("Not found", { status: 404 });

  const lang: Lang = u.searchParams.get("lang") === "ky" ? "ky" : "ru";
  const service = RATING_SERVICES.find((s) => s.id === u.searchParams.get("id"));
  if (!service) return Response.json({ ok: false, error: "unknown id", ids: RATING_SERVICES.map((s) => s.id) }, { status: 400 });

  try {
    let appId = service.appId;
    if (!appId && service.query) {
      const found = await gplay.search({ term: service.query, num: 3, lang: "ru", country: "kg" });
      appId = found[0]?.appId;
      if (!appId) throw new AnalyzeError("play_no_policy", 404);
    }
    const url = appId ? `https://play.google.com/store/apps/details?id=${appId}` : service.url!;
    const { report, meta } = await runAnalysis({ kind: "url", url }, lang, service.forChild === true);
    return Response.json({ ok: true, id: service.id, lang, appId, analyzedAt: new Date().toISOString(), report, meta });
  } catch (e) {
    const code = e instanceof AnalyzeError ? e.code : "ai_failed";
    if (!(e instanceof AnalyzeError)) console.error("[rating]", e);
    return Response.json({ ok: false, id: service.id, lang, error: code }, { status: 502 });
  }
}

/** POST { key, lang, report }: translate an existing rating report so both languages show the same score. */
export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_KEY;
  const body = (await req.json().catch(() => ({}))) as { key?: string; lang?: string; report?: unknown };
  if (!adminKey || body.key !== adminKey) return new Response("Not found", { status: 404 });
  const lang: Lang = body.lang === "ru" ? "ru" : "ky";
  try {
    const source = normalizeReport(body.report, lang === "ky" ? "ru" : "ky");
    // keep the original verification flags (normalize without source text drops them)
    const original = body.report as { red_flags?: { quote_verified?: boolean }[] };
    source.red_flags = source.red_flags.map((f, i) => ({ ...f, quote_verified: original.red_flags?.[i]?.quote_verified }));
    const { json, model } = await translateReportWithGemini(source, lang);
    return Response.json({ ok: true, lang, model, report: mergeTranslation(source, json, lang) });
  } catch (e) {
    const code = e instanceof AnalyzeError ? e.code : "ai_failed";
    if (!(e instanceof AnalyzeError)) console.error("[rating translate]", e);
    return Response.json({ ok: false, error: code }, { status: 502 });
  }
}
