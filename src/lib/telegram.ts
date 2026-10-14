import "server-only";
import { createHash } from "node:crypto";
import { CheckError } from "./ai";
import { runCheck, type CheckInput } from "./check";
import { SCHEMES } from "@/content/schemes";
import type { CheckResult, ErrorCode, Indicator, Lang, Verdict } from "./types";

const API = "https://api.telegram.org";
export const botToken = () => process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
/** Secret Telegram sends back in every webhook call, so nobody else can post updates to us. */
export const webhookSecret = () => createHash("sha256").update(`kalkan:${botToken()}`).digest("hex").slice(0, 48);

export async function tg<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T | null> {
  const token = botToken();
  if (!token) return null;
  try {
    const r = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    const j = (await r.json()) as { ok: boolean; result?: T; description?: string };
    if (!j.ok) console.warn(`[tg] ${method}: ${j.description}`);
    return j.ok ? (j.result ?? null) : null;
  } catch (e) {
    console.warn(`[tg] ${method}: ${(e as Error).name}`);
    return null;
  }
}

/* ---------------- texts ---------------- */

const T = {
  ru: {
    start:
      "🛡 <b>Калкан</b> — проверь, прежде чем нажать.\n\nПерешли мне подозрительное сообщение или пришли:\n• ссылку\n• номер телефона\n• скриншот переписки или сайта\n• ссылку на приложение из Google Play\n\nЯ скажу, похоже ли это на мошенников, и что делать.\n\nЯзык: /lang",
    working: "⏳ Проверяю…",
    label: { danger: "🔴 ОПАСНО", suspicious: "🟡 ПОДОЗРИТЕЛЬНО", safe: "🟢 Признаков обмана нет", unknown: "⚪ Недостаточно данных" } as Record<Verdict, string>,
    why: "Почему",
    todo: "Что делать",
    scheme: "Схема",
    links: "Ссылки из сообщения",
    reports: (n: number) => `🚩 Жалоб от пользователей: ${n}`,
    report: "🚩 Пожаловаться: это мошенники",
    reported: "Спасибо! Жалоба учтена.",
    reportFail: "Не получилось сохранить жалобу.",
    langChosen: "Готово, теперь отвечаю на русском.",
    chooseLang: "Выбери язык ответа:",
    limit: "Слишком много проверок подряд. Попробуй через несколько минут.",
    tooBig: "Картинка слишком большая. Пришли скриншот до 3 МБ.",
    apk:
      "🔴 <b>ОПАСНО: не устанавливай этот файл</b>\n\nПриложения (.apk) из чатов — главный способ заразить телефон вирусом, который читает SMS и крадёт деньги из банковских приложений.\n\n1. Удали файл и не открывай его.\n2. Если уже установил — сразу позвони в банк и заблокируй карту, затем удали приложение.\n3. Предупреди того, кто прислал: его аккаунт могли взломать.",
    unsupported: "Пришли текст, ссылку, номер или скриншот.",
    more: "Подробнее на сайте",
    disclaimer: "Калкан проверяет по признакам и может ошибаться. Банки и милиция никогда не просят коды из SMS.",
    errors: {
      invalid_url: "Это не похоже на ссылку.",
      empty: "Пришли текст, ссылку, номер или скриншот.",
      rate_limit: "ИИ сейчас перегружен. Попробуй через минуту.",
      ai_busy: "ИИ сейчас перегружен. Попробуй через минуту.",
      file_type: "Нужна картинка или скриншот.",
      file_too_big: "Картинка слишком большая. Нужно до 3 МБ.",
      default: "Не получилось проверить. Попробуй ещё раз чуть позже.",
    } as Partial<Record<ErrorCode, string>> & { default: string },
  },
  ky: {
    start:
      "🛡 <b>Калкан</b> — баспай туруп текшер.\n\nМага шектүү билдирүүнү жөнөт же жибер:\n• шилтеме\n• телефон номери\n• кат алышуунун же сайттын скриншоту\n• Google Playдеги тиркеменин шилтемеси\n\nБул алдамчыларга окшошпу жана эмне кылуу керек экенин айтам.\n\nТил: /lang",
    working: "⏳ Текшерип жатам…",
    label: { danger: "🔴 КОРКУНУЧТУУ", suspicious: "🟡 ШЕКТҮҮ", safe: "🟢 Алдоонун белгилери жок", unknown: "⚪ Маалымат жетишсиз" },
    why: "Эмне үчүн",
    todo: "Эмне кылуу керек",
    scheme: "Схема",
    links: "Билдирүүдөгү шилтемелер",
    reports: (n: number) => `🚩 Колдонуучулардын даттануулары: ${n}`,
    report: "🚩 Даттануу: бул алдамчылар",
    reported: "Рахмат! Даттануу эсепке алынды.",
    reportFail: "Даттанууну сактоо болбой калды.",
    langChosen: "Даяр, эми кыргызча жооп берем.",
    chooseLang: "Жооптун тилин танда:",
    limit: "Катары менен өтө көп текшерүү. Бир нече мүнөттөн кийин аракет кыл.",
    tooBig: "Сүрөт өтө чоң. 3 МБга чейинки скриншот жибер.",
    apk:
      "🔴 <b>КОРКУНУЧТУУ: бул файлды орнотпо</b>\n\nЧаттардагы тиркемелер (.apk) — телефонго SMS окуп, банк тиркемелеринен акча уурдаган вирусту жуктуруунун негизги жолу.\n\n1. Файлды өчүр жана ачпа.\n2. Эгер орнотуп койсоң — дароо банкка чалып, картаны бөгөттө, андан кийин тиркемени өчүр.\n3. Жөнөткөн адамды эскерт: анын аккаунтун бузушкан болушу мүмкүн.",
    unsupported: "Текст, шилтеме, номер же скриншот жибер.",
    more: "Сайтта кененирээк",
    disclaimer: "Калкан белгилер боюнча текшерет жана жаңылышы мүмкүн. Банктар жана милиция SMS коддорун эч качан сурабайт.",
    errors: {
      invalid_url: "Бул шилтемеге окшобойт.",
      empty: "Текст, шилтеме, номер же скриншот жибер.",
      rate_limit: "ЖИ азыр ашыкча жүктөлгөн. Бир мүнөттөн кийин аракет кыл.",
      ai_busy: "ЖИ азыр ашыкча жүктөлгөн. Бир мүнөттөн кийин аракет кыл.",
      file_type: "Сүрөт же скриншот керек.",
      file_too_big: "Сүрөт өтө чоң. 3 МБга чейин керек.",
      default: "Текшерүү болбой калды. Бир аздан кийин кайра аракет кыл.",
    } as Partial<Record<ErrorCode, string>> & { default: string },
  },
};
export const botText = (lang: Lang) => T[lang];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const DOT = { bad: "❌", warn: "⚠️", good: "✅", info: "ℹ️" } as const;

export function formatResult(r: CheckResult, lang: Lang, site: string): string {
  const t = T[lang];
  const lines: string[] = [];
  lines.push(`${t.label[r.verdict]}`, `<b>${esc(r.title)}</b>`, `<i>${esc(r.subject)}</i>`, "", esc(r.summary));
  if (r.reports > 0) lines.push("", t.reports(r.reports));
  if (r.signals.length) {
    lines.push("", `<b>${t.why}</b>`);
    r.signals.slice(0, 6).forEach((s) => lines.push(`${DOT[s.level]} ${esc(s.text)}`));
  }
  if (r.scheme) {
    const s = SCHEMES[lang][r.scheme];
    lines.push("", `<b>${t.scheme}:</b> <a href="${site}/schemes#${r.scheme}">${esc(s.name)}</a>`);
  }
  if (r.advice.length) {
    lines.push("", `<b>${t.todo}</b>`);
    r.advice.slice(0, 4).forEach((a, i) => lines.push(`${i + 1}. ${esc(a)}`));
  }
  lines.push("", `<i>${t.disclaimer}</i>`);
  let text = lines.join("\n");
  if (text.length > 4000) text = text.slice(0, 3990) + "…";
  return text;
}

/* ---------------- report button: the indicator travels inside callback_data (max 64 bytes) ---------------- */

const CODE = { domain: "d", phone: "p", app: "a" } as const;
export function reportButton(r: CheckResult, lang: Lang) {
  if (r.verdict === "safe") return undefined;
  const i = r.indicators[0] ?? r.links.find((l) => l.indicators.length)?.indicators[0];
  if (!i) return undefined;
  const data = `r:${CODE[i.type]}:${i.value}`;
  if (Buffer.byteLength(data) > 64) return undefined;
  return { inline_keyboard: [[{ text: T[lang].report, callback_data: data }]] };
}

export function parseReportData(data: string): Partial<Indicator> | null {
  const m = data.match(/^r:([dpa]):(.+)$/);
  if (!m) return null;
  const type = m[1] === "d" ? "domain" : m[1] === "p" ? "phone" : "app";
  return { type, value: m[2] };
}

/* ---------------- per-chat state (in memory; good enough for a bot of this size) ---------------- */

const chatLang = new Map<number, Lang>();
export function getLang(chatId: number, fallback?: string): Lang {
  return chatLang.get(chatId) ?? (fallback?.startsWith("ky") ? "ky" : "ru");
}
export function setLang(chatId: number, lang: Lang) {
  chatLang.set(chatId, lang);
  if (chatLang.size > 50_000) chatLang.clear();
}

const usage = new Map<string, number[]>();
export function chatTooMany(chatId: number, bucket = "check", perMinute = 6, perDay = 60): boolean {
  const key = `${bucket}:${chatId}`;
  const now = Date.now();
  const day = (usage.get(key) ?? []).filter((t) => now - t < 86_400_000);
  if (day.filter((t) => now - t < 60_000).length >= perMinute || day.length >= perDay) return true;
  day.push(now);
  usage.set(key, day);
  if (usage.size > 50_000) usage.clear();
  return false;
}

/** Downloads a file the user sent to the bot (Telegram gives bots files up to 20 MB). */
export async function downloadTelegramFile(fileId: string): Promise<Buffer | null> {
  const f = await tg<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!f?.file_path) return null;
  try {
    const r = await fetch(`${API}/file/bot${botToken()}/${f.file_path}`, { signal: AbortSignal.timeout(30_000) });
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** Runs the check and replaces the "checking…" message with the verdict. */
export async function checkForChat(chatId: number, messageId: number | null, input: CheckInput, lang: Lang, site: string) {
  const t = T[lang];
  let text: string;
  let markup: unknown;
  try {
    const result = await runCheck(input, lang);
    text = formatResult(result, lang, site);
    markup = reportButton(result, lang);
  } catch (e) {
    const code = e instanceof CheckError ? e.code : "ai_failed";
    if (!(e instanceof CheckError)) console.error("[tg check]", e);
    text = `⚠️ ${t.errors[code] ?? t.errors.default}`;
  }
  const payload = { chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true }, ...(markup ? { reply_markup: markup } : {}) };
  const edited = messageId ? await tg("editMessageText", { ...payload, message_id: messageId }) : null;
  if (!edited) await tg("sendMessage", payload);
}
