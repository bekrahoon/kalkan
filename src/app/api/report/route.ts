import { clientIp, sameOrigin, tooMany } from "@/lib/guard";
import { addReport, clearReports } from "@/lib/reports";
import { reportableIndicators } from "@/lib/report-input";

/** "This is fraud" button. Limited per IP so one person cannot flood a domain with reports. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { indicators?: unknown };
  const indicators = reportableIndicators(body.indicators);
  if (!indicators.length) return Response.json({ ok: false }, { status: 400 });
  if (tooMany(clientIp(req), 5, 30, "report")) return Response.json({ ok: false, error: "too_many_requests" }, { status: 429 });
  const counts = await Promise.all(indicators.map(addReport));
  return Response.json({ ok: counts.some((c) => c !== null), counts });
}

/**
 * Moderation for false reports (official sites can't be reported at all):
 *   DELETE /api/report?key=ADMIN_KEY&type=domain|app&value=…
 */
export async function DELETE(req: Request) {
  const u = new URL(req.url);
  if (!process.env.ADMIN_KEY || u.searchParams.get("key") !== process.env.ADMIN_KEY) return new Response("Not found", { status: 404 });
  const type = u.searchParams.get("type");
  const value = u.searchParams.get("value") ?? "";
  const ok = await clearReports({ type: type as "domain" | "app", value, display: value });
  return Response.json({ ok });
}
