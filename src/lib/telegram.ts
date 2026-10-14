import "server-only";
import { createHash } from "node:crypto";
import { AnalyzeError } from "./gemini";
import { runAnalysis, type AnalysisInput } from "./pipeline";
import type { ErrorCode, Lang, Report } from "./types";

const API = "https://api.telegram.org";
export const botToken = () => process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
/** Secret Telegram sends back in every webhook call, so nobody else can post updates to us. */
export const webhookSecret = () =>
  createHash("sha256").update(`kalkan:${botToken()}`).digest("hex").slice(0, 48);

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
      "🛡 <b>Калкан</b> объясняет простыми словами, что приложение или сайт делает с твоими данными.\n\nПришли мне:\n• ссылку на сайт, политику конфиденциальности или приложение в Google Play\n• текст политики\n• PDF или скриншот политики\n\nЯзык: /lang",
    hint: "Пришли ссылку, текст политики (от 200 символов), PDF или скриншот. Например, ссылку на приложение из Google Play: «Поделиться» → «Копировать ссылку».",
    working: "⏳ Читаю мелкий шрифт… Обычно это 20–60 секунд.",
    risk: "Риск",
    levels: { low: "низкий", medium: "средний", high: "высокий" },
    flags: "🚩 Красные флаги",
    noFlags: "✅ Явно опасных пунктов не нашёл.",
    todo: "👉",
    why: "Почему такой балл",
    full: "Полный отчёт",
    langChosen: "Готово, теперь отвечаю на русском.",
    chooseLang: "Выбери язык ответа:",
    limit: "Слишком много проверок подряд. Попробуй через несколько минут.",
    tooBig: "Файл слишком большой. Пришли PDF или фото до 3 МБ.",
    disclaimer: "Это оценка ИИ по тексту политики, не юридическая консультация.",
    errors: {
      invalid_url: "Это не похоже на ссылку.",
      fetch_failed: "Сайт не открылся. Пришли текст политики или скриншот.",
      fetch_timeout: "Сайт слишком долго не отвечает. Пришли текст политики или скриншот.",
      fetch_status: "Сайт не пускает роботов. Пришли текст политики или скриншот.",
      too_little_text: "На странице почти нет текста. Пришли текст политики или скриншот.",
      play_no_policy: "У приложения в Google Play нет ссылки на политику. Найди её на сайте разработчика.",
      rate_limit: "ИИ сейчас перегружен. Попробуй через минуту.",
      ai_busy: "ИИ сейчас перегружен. Попробуй через минуту.",
      file_type: "Этот формат не подходит. Нужен PDF или картинка.",
      file_too_big: "Файл слишком большой. Нужен PDF или фото до 3 МБ.",
      default: "Не получилось проверить. Попробуй ещё раз чуть позже.",
    } as Partial<Record<ErrorCode, string>> & { default: string },
  },
  ky: {
    start:
      "🛡 <b>Калкан</b> тиркеме же сайт сенин маалыматтарың менен эмне кыларын жөнөкөй сөз менен түшүндүрөт.\n\nМага жибер:\n• сайттын, купуялык саясатынын же Google Playдеги тиркеменин шилтемесин\n• саясаттын текстин\n• саясаттын PDFин же скриншотун\n\nТил: /lang",
    hint: "Шилтеме, саясаттын тексти (200 белгиден көп), PDF же скриншот жибер. Мисалы, Google Playден тиркеменин шилтемеси: «Бөлүшүү» → «Шилтемени көчүрүү».",
    working: "⏳ Майда тамгаларды окуп жатам… Адатта 20–60 секунд.",
    risk: "Тобокелдик",
    levels: { low: "төмөн", medium: "орточо", high: "жогору" },
    flags: "🚩 Кызыл желектер",
    noFlags: "✅ Ачык коркунучтуу пункттар табылган жок.",
    todo: "👉",
    why: "Эмне үчүн мындай балл",
    full: "Толук отчёт",
    langChosen: "Даяр, эми кыргызча жооп берем.",
    chooseLang: "Жооптун тилин танда:",
    limit: "Катары менен өтө көп текшерүү. Бир нече мүнөттөн кийин аракет кыл.",
    tooBig: "Файл өтө чоң. 3 МБга чейинки PDF же сүрөт жибер.",
    disclaimer: "Бул ЖИнин саясаттын тексти боюнча баасы, юридикалык кеңеш эмес.",
    errors: {
      invalid_url: "Бул шилтемеге окшобойт.",
      fetch_failed: "Сайт ачылган жок. Саясаттын текстин же скриншотун жибер.",
      fetch_timeout: "Сайт өтө узак жооп бербей жатат. Саясаттын текстин же скриншотун жибер.",
      fetch_status: "Сайт роботторду киргизбейт. Саясаттын текстин же скриншотун жибер.",
      too_little_text: "Баракта текст дээрлик жок. Саясаттын текстин же скриншотун жибер.",
      play_no_policy: "Google Playде бул тиркеменин саясатына шилтеме жок. Аны иштеп чыгуучунун сайтынан изде.",
      rate_limit: "ЖИ азыр ашыкча жүктөлгөн. Бир мүнөттөн кийин аракет кыл.",
      ai_busy: "ЖИ азыр ашыкча жүктөлгөн. Бир мүнөттөн кийин аракет кыл.",
      file_type: "Бул формат туура келбейт. PDF же сүрөт керек.",
      file_too_big: "Файл өтө чоң. 3 МБга чейинки PDF же сүрөт керек.",
      default: "Текшерүү болбой калды. Бир аздан кийин кайра аракет кыл.",
    } as Partial<Record<ErrorCode, string>> & { default: string },
  },
};
export const botText = (lang: Lang) => T[lang];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const LEVEL_DOT = { low: "🟢", medium: "🟡", high: "🔴" } as const;

export function formatReport(r: Report, lang: Lang, siteUrl: string | null): string {
  const t = T[lang];
  const lines: string[] = [];
  lines.push(`🛡 <b>${esc(r.company_name || "Калкан")}</b>`);
  lines.push(`${LEVEL_DOT[r.risk_level]} ${t.risk}: <b>${r.risk_score}/100</b> — ${t.levels[r.risk_level]}`);
  lines.push("", esc(r.summary));
  if (r.red_flags.length) {
    lines.push("", `<b>${t.flags}</b>`);
    r.red_flags.slice(0, 4).forEach((f, i) => {
      lines.push(`${i + 1}. <b>${esc(f.title)}</b> — ${esc(f.explanation)}`);
      if (f.action) lines.push(`   ${t.todo} ${esc(f.action)}`);
    });
  } else {
    lines.push("", t.noFlags);
  }
  const top = [...r.risk_factors].sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).slice(0, 4);
  if (top.length) {
    lines.push("", `<b>${t.why}</b>`);
    top.forEach((f) => lines.push(`${f.points > 0 ? "+" : "−"}${Math.abs(f.points)} ${esc(f.factor)}`));
  }
  if (siteUrl) lines.push("", `<a href="${esc(siteUrl)}">${t.full} →</a>`);
  lines.push("", `<i>${t.disclaimer}</i>`);
  let text = lines.join("\n");
  if (text.length > 4000) text = text.slice(0, 3990) + "…";
  return text;
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

const usage = new Map<number, number[]>();
export function chatTooMany(chatId: number): boolean {
  const now = Date.now();
  const day = (usage.get(chatId) ?? []).filter((t) => now - t < 86_400_000);
  if (day.filter((t) => now - t < 60_000).length >= 3 || day.length >= 20) return true;
  day.push(now);
  usage.set(chatId, day);
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

/** Runs the analysis and replaces the "working…" message with the result. */
export async function analyzeForChat(chatId: number, messageId: number | null, input: AnalysisInput, lang: Lang, site: string) {
  const t = T[lang];
  let text: string;
  try {
    const { report } = await runAnalysis(input, lang);
    const link = input.kind === "url" ? `${site}/?check=${encodeURIComponent(input.url)}` : site;
    text = formatReport(report, lang, link);
  } catch (e) {
    const code = e instanceof AnalyzeError ? e.code : "ai_failed";
    if (!(e instanceof AnalyzeError)) console.error("[tg analyze]", e);
    text = `⚠️ ${t.errors[code] ?? t.errors.default}`;
  }
  const payload = { chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true } };
  const edited = messageId ? await tg("editMessageText", { ...payload, message_id: messageId }) : null;
  if (!edited) await tg("sendMessage", payload);
}
