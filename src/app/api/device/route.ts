import { CheckError } from "@/lib/ai";
import { runCheck } from "@/lib/check";
import { authDevice, deviceOwner, registerDevice, updateDevice } from "@/lib/devices";
import { alertGuardians, createInvite, familyText, getFamily } from "@/lib/family";
import { clientIp, tooMany } from "@/lib/guard";
import { toLang } from "@/lib/types";

/*
 * API for the Android guard app. One endpoint, POST JSON with "action":
 *   register { name, lang }                 → { id, secret }
 *   check    { id, secret, text, app? }     → verdict; on "danger" the trusted people are alerted
 *   link     { id, secret }                 → invite link for a relative (/start fam_…)
 *   status   { id, secret }                 → trusted people names
 *   sos      { id, secret }                 → alerts the trusted people right away
 *   rename   { id, secret, name, lang? }
 */
export const maxDuration = 60;

const SOS_TEXT = {
  ru: "нажал(а) кнопку SOS в приложении KalkanCheck",
  ky: "KalkanCheck тиркемесинде SOS баскычын басты",
  en: "pressed the SOS button in the KalkanCheck app",
};

const json = (data: unknown, status = 200) => Response.json(data, { status });
const cleanName = (v: unknown) => (typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, 40) : "");

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") return json({ ok: false, error: "bad_request" }, 400);
  const ip = clientIp(req);

  if (body.action === "register") {
    if (tooMany(ip, 5, 30, "device-register")) return json({ ok: false, error: "too_many_requests" }, 429);
    const name = cleanName(body.name);
    if (!name) return json({ ok: false, error: "bad_request" }, 400);
    const { id, secret } = await registerDevice(name, toLang(body.lang));
    return json({ ok: true, id, secret });
  }

  const device = await authDevice(body.id, body.secret);
  if (!device) return json({ ok: false, error: "unauthorized" }, 401);
  const owner = deviceOwner(device.id);
  const lang = toLang(body.lang ?? device.lang);

  switch (body.action) {
    case "check": {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, 3000) : "";
      if (!text) return json({ ok: false, error: "empty" }, 400);
      if (tooMany(device.id, 15, 300, "device-check")) return json({ ok: false, error: "too_many_requests" }, 429);
      try {
        const r = await runCheck({ text }, lang);
        const warned = r.verdict === "danger" ? await alertGuardians(owner, device.name, { danger: r }).catch(() => []) : [];
        return json({
          ok: true,
          verdict: r.verdict,
          title: r.title,
          summary: r.summary,
          subject: r.subject,
          advice: r.advice.slice(0, 3),
          reasons: r.signals.filter((s) => s.level === "bad" || s.level === "warn").slice(0, 3).map((s) => s.text),
          warned,
        });
      } catch (e) {
        const code = e instanceof CheckError ? e.code : "ai_failed";
        if (!(e instanceof CheckError)) console.error("[device check]", e);
        return json({ ok: false, error: code }, 200);
      }
    }
    case "link": {
      const code = await createInvite(owner, device.name);
      const link = `https://t.me/kalkan_kgs_bot?start=fam_${code}`;
      return json({ ok: true, link, text: familyText(lang).invite(device.name, link) });
    }
    case "status": {
      const fam = await getFamily(owner);
      return json({ ok: true, name: device.name, guardians: (fam?.guardians ?? []).map((g) => g.name) });
    }
    case "sos": {
      if (tooMany(device.id, 3, 30, "device-sos")) return json({ ok: false, error: "too_many_requests" }, 429);
      const warned = await alertGuardians(owner, device.name, { panic: SOS_TEXT[lang] }).catch(() => []);
      return json({ ok: true, warned });
    }
    case "rename": {
      const name = cleanName(body.name);
      if (!name) return json({ ok: false, error: "bad_request" }, 400);
      await updateDevice(device.id, { name, lang });
      return json({ ok: true });
    }
    default:
      return json({ ok: false, error: "bad_request" }, 400);
  }
}
