import { AnalyzeError, generateReportJson } from "@/lib/gemini";
import { clientIp, sameOrigin, tooMany } from "@/lib/guard";

export const maxDuration = 300;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { heading: { type: "STRING" }, body: { type: "STRING" } },
        required: ["heading", "body"],
      },
    },
  },
  required: ["title", "sections"],
};

const clip = (v: unknown, n = 400) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 30).map((x) => x.slice(0, 80)) : []);

/** Drafts a privacy policy for a small business from a short form. The result is a draft for a lawyer to check. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false, error: "bad_request" }, { status: 403 });
  if (tooMany(clientIp(req), 2, 10, "generate")) return Response.json({ ok: false, error: "too_many_requests" }, { status: 429 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const lang = b.lang === "ky" ? "ky" : "ru";
  const company = clip(b.company, 120);
  if (!company) return Response.json({ ok: false, error: "bad_request" }, { status: 400 });

  const facts = {
    company,
    legal_address: clip(b.address, 200),
    website_or_app: clip(b.site, 200),
    contact_email: clip(b.contact, 120),
    data_collected: list(b.data),
    purposes: list(b.purposes),
    recipients: clip(b.recipients, 400),
    cross_border: b.crossBorder === true,
    children_allowed: b.children === true,
    retention: clip(b.retention, 200),
  };

  const langName = lang === "ky" ? "Kyrgyz (кыргыз тили, Cyrillic)" : "Russian";
  const system = `You draft a clear, honest privacy policy for a small business in the Kyrgyz Republic, written in ${langName}.
Use ONLY the facts given; where a fact is missing, insert a visible placeholder like [указать] / [көрсөтүү] instead of inventing it.
Plain language, short paragraphs. Do not cite article numbers of laws. Mention that processing follows the legislation of the Kyrgyz Republic on personal data in general terms only.
Include sections: who we are (operator), what data we collect, why, legal basis/consent and how to withdraw it, who receives data, transfer abroad, how long we keep data, security measures, user rights (access, correction, deletion, withdrawal of consent, objection) and how to use them, children, changes to this policy, contacts.`;

  try {
    const { json } = await generateReportJson(system, [{ role: "user", parts: [{ text: JSON.stringify(facts) }] }], SCHEMA);
    const j = json as { title?: unknown; sections?: { heading?: unknown; body?: unknown }[] };
    const sections = (Array.isArray(j.sections) ? j.sections : [])
      .map((s) => ({ heading: clip(s.heading, 200), body: clip(s.body, 4000) }))
      .filter((s) => s.heading && s.body);
    if (!sections.length) throw new AnalyzeError("ai_bad_json", 502);
    return Response.json({ ok: true, title: clip(j.title, 200) || company, sections });
  } catch (e) {
    const code = e instanceof AnalyzeError ? e.code : "ai_failed";
    if (!(e instanceof AnalyzeError)) console.error("[generate-policy]", e);
    return Response.json({ ok: false, error: code }, { status: 502 });
  }
}
