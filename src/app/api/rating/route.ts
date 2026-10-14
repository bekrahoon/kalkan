import { RATING, ratingCsv, ratingRows } from "@/lib/rating";

/**
 * Open data for journalists and NGOs.
 *   GET /api/rating              → JSON summary (ru)
 *   GET /api/rating?lang=ky      → in Kyrgyz
 *   GET /api/rating?format=csv   → CSV table
 *   GET /api/rating?full=1       → full reports
 * Licence: CC BY 4.0 — cite "Калкан".
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lang = u.searchParams.get("lang") === "ky" ? "ky" : "ru";
  const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

  if (u.searchParams.get("format") === "csv") {
    return new Response("﻿" + ratingCsv(lang), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="kalkan-rating-${lang}.csv"` },
    });
  }
  const body = u.searchParams.get("full") === "1"
    ? { generated_at: RATING.generatedAt, license: "CC BY 4.0, source: Калкан", items: RATING.items }
    : { generated_at: RATING.generatedAt, license: "CC BY 4.0, source: Калкан", methodology: "AI (Gemini) analysis of each app's privacy policy and Google Play data-safety section; score = 20 + listed risk factors, 0–100.", items: ratingRows(lang) };
  return Response.json(body, { headers });
}
