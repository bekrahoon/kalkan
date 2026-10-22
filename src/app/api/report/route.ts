import { tooMany } from "@/server/security/rate-limit";
import { clientIp, sameOrigin } from "@/server/security/request";
import { isAdmin } from "@/server/security/secrets";
import { addReport, clearReports } from "@/server/reports/store";
import { reportableIndicators } from "@/server/reports/validate";

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
 *   curl -X DELETE -H "Authorization: Bearer $ADMIN_KEY" "…/api/report?type=domain&value=example.com"
 */
export async function DELETE(req: Request) {
  if (!isAdmin(req)) return new Response("Not found", { status: 404 });
  const u = new URL(req.url);
  const type = u.searchParams.get("type");
  const value = (u.searchParams.get("value") ?? "").trim().toLowerCase().slice(0, 253);
  if ((type !== "domain" && type !== "app") || !/^[a-z0-9][a-z0-9._-]*$/.test(value)) return Response.json({ ok: false }, { status: 400 });
  const ok = await clearReports({ type, value, display: value });
  return Response.json({ ok });
}
