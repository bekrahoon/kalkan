import "server-only";
import { generateJson, type GeminiPart } from "../ai";
import { SCHEME_IDS, VERDICTS, type Lang, type SchemeId, type Signal, type Verdict } from "../types";

/** What the AI adds on top of the technical checks: plain-language verdict, the scheme, advice. */
export interface AiVerdict {
  verdict: Verdict;
  title: string;
  summary: string;
  scheme: SchemeId | null;
  signals: Signal[];
  advice: string[];
  urls: string[];
  phones: string[];
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: [...VERDICTS] },
    title: { type: "STRING", description: "Headline, max 60 characters, e.g. 'Fake MBANK login page'." },
    summary: { type: "STRING", description: "1–2 short sentences for an ordinary person: what this is and the main reason." },
    scheme: { type: "STRING", enum: [...SCHEME_IDS, "none"] },
    signals: {
      type: "ARRAY",
      description: "Concrete red flags (or reassuring facts) you see. Max 5. Do not repeat the technical facts already given.",
      items: {
        type: "OBJECT",
        properties: { level: { type: "STRING", enum: ["bad", "warn", "good"] }, text: { type: "STRING" } },
        required: ["level", "text"],
      },
    },
    advice: { type: "ARRAY", description: "2–4 concrete next steps, imperative, short.", items: { type: "STRING" } },
    urls: { type: "ARRAY", description: "Every web link visible in the message or image (empty if none).", items: { type: "STRING" } },
    phones: { type: "ARRAY", description: "Phone numbers visible in the message or image (empty if none).", items: { type: "STRING" } },
  },
  required: ["verdict", "title", "summary", "scheme", "signals", "advice", "urls", "phones"],
};

const SCHEME_GUIDE = `Schemes (pick the closest or "none"):
fake_bank – "bank security service": blocked card, suspicious transaction, asks for SMS code / card data / transfer to a "safe account".
relative – a relative or friend writes from a new number: urgent money, accident, police, broken phone.
voting – "vote for my niece/child in a contest": link leads to a fake Telegram/WhatsApp login (account theft).
sms_code – asks to read out a code from SMS/Telegram ("sent it to you by mistake", "to confirm delivery").
prize – you won a prize / are owed a payout, but must pay delivery/tax or enter card data.
investment – guaranteed high returns, crypto, trading bots, "closed channel", deposit to a person's card.
job – easy job for big money (likes, tasks, reviews) that later requires a deposit or fee.
marketplace – buyer/seller on Lalafo etc. moves to WhatsApp and sends a link "to receive payment" asking for card data.
fake_gov – pretends to be police, tax service, Tunduk or other government: fines, debts, threats, payment links.
loan – loans with upfront fees, or loan apps that grab contacts and harass them.
fake_shop – goods far below market price, prepayment only to a personal card.
phishing – fake website/login of a bank, mail, social network asking for credentials or card data.
deepfake – AI-faked voice or video of a known person or celebrity asking for money or promoting investments.`;

function langName(lang: Lang) {
  return lang === "ky" ? "Kyrgyz (Cyrillic, simple everyday language)" : "Russian (simple everyday language)";
}

const RULES = `You are Kalkan, an anti-fraud assistant for people in Kyrgyzstan (Bishkek, regions). Be concrete and calm, address the reader informally ("ты"/"сен").
Verdicts: danger = clear signs of fraud; suspicious = worrying signs, be careful; safe = looks legitimate (never promise 100%); unknown = not enough information.
Never invent facts that are not in the input. Never claim a site is official unless the input says so. If the technical facts say "official site", do not call it fraud because of normal login or payment forms.
Real banks, Telegram and government bodies never ask for SMS codes, CVV or passwords by phone or messenger.`;

export async function aiForLink(facts: Record<string, unknown>, lang: Lang, budgetMs: number): Promise<AiVerdict> {
  const system = `${RULES}
Task: judge one web link using the technical facts collected by our server and the text of the page.
${SCHEME_GUIDE}
Write all human-readable fields in ${langName(lang)}. Leave urls and phones empty.`;
  const { json } = await generateJson<Record<string, unknown>>(system, [{ text: JSON.stringify(facts) }], SCHEMA, budgetMs);
  return clean(json);
}

export async function aiForMessage(text: string, image: { mime: string; data: string } | null, lang: Lang, budgetMs: number): Promise<AiVerdict> {
  const system = `${RULES}
Task: the user received a message (or a screenshot of a chat, SMS, e-mail, website or call screen) and asks whether it is a scam.
Judge the message itself: who writes, what they want, pressure, requests for codes/cards/money, links.
List every link and phone number you see in urls and phones exactly as written. Links will be checked separately by our server.
If the content is an ordinary harmless message, say safe; if it is not a message at all or unreadable, say unknown.
${SCHEME_GUIDE}
Write all human-readable fields in ${langName(lang)}.`;
  const parts: GeminiPart[] = [];
  if (image) parts.push({ inlineData: { mimeType: image.mime, data: image.data } });
  parts.push({ text: text ? `<<<MESSAGE\n${text.slice(0, 6000)}\nMESSAGE>>>` : "Check the attached screenshot." });
  const { json } = await generateJson<Record<string, unknown>>(system, parts, SCHEMA, budgetMs);
  return clean(json);
}

export async function aiForFacts(kind: "app" | "phone", facts: Record<string, unknown>, lang: Lang, budgetMs: number): Promise<AiVerdict> {
  const what = kind === "app" ? "one Android app from Google Play (facts from its store page and requested permissions)" : "one phone number";
  const system = `${RULES}
Task: judge ${what} using only the facts given.
${SCHEME_GUIDE}
Write all human-readable fields in ${langName(lang)}. Leave urls and phones empty.`;
  const { json } = await generateJson<Record<string, unknown>>(system, [{ text: JSON.stringify(facts) }], SCHEMA, budgetMs);
  return clean(json);
}

const s = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function clean(j: Record<string, unknown>): AiVerdict {
  const verdict = (VERDICTS as readonly string[]).includes(j.verdict as string) ? (j.verdict as Verdict) : "unknown";
  const scheme = (SCHEME_IDS as readonly string[]).includes(j.scheme as string) ? (j.scheme as SchemeId) : null;
  const signals = (Array.isArray(j.signals) ? j.signals : [])
    .map((x) => ({ level: ["bad", "warn", "good"].includes(x?.level) ? x.level : "warn", text: s(x?.text, 300) }) as Signal)
    .filter((x) => x.text)
    .slice(0, 5);
  const list = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v.map((x) => s(x, max)).filter(Boolean).slice(0, n) : []);
  return {
    verdict,
    title: s(j.title, 90),
    summary: s(j.summary, 500),
    scheme,
    signals,
    advice: list(j.advice, 4, 240),
    urls: list(j.urls, 5, 500),
    phones: list(j.phones, 5, 40),
  };
}
