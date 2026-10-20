import { after } from "next/server";
import { addReport } from "@/lib/reports";
import { reportableIndicators } from "@/lib/report-input";
import {
  botText,
  botToken,
  chatTooMany,
  checkForChat,
  downloadTelegramFile,
  getLang,
  parseReportData,
  setLang,
  tg,
  webhookSecret,
} from "@/lib/telegram";
import { MAX_FILE_BYTES, toLang } from "@/lib/types";
import { botId, guardGroupMessage, sendGroupIntro } from "@/lib/telegram-group";

/** The check runs after we answer Telegram (it waits only a few seconds for webhooks). */
export const maxDuration = 60;

interface TgEntity {
  type: string;
  url?: string;
}
interface TgMessage {
  message_id: number;
  chat: { id: number; type?: string };
  from?: { language_code?: string; is_bot?: boolean };
  text?: string;
  caption?: string;
  entities?: TgEntity[];
  caption_entities?: TgEntity[];
  document?: { file_id: string; file_name?: string; mime_type?: string; file_size?: number };
  photo?: { file_id: string; file_size?: number; width: number }[];
}
interface TgUpdate {
  message?: TgMessage;
  my_chat_member?: {
    chat: { id: number; type: string };
    from?: { language_code?: string };
    old_chat_member: { status: string };
    new_chat_member: { status: string; user: { id: number } };
  };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number }; message_id: number }; from?: { language_code?: string } };
}

const site = (req: Request) => `https://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;

export async function POST(req: Request) {
  if (!botToken() || req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) {
    return new Response("Not found", { status: 404 });
  }
  const update = (await req.json().catch(() => ({}))) as TgUpdate;

  // The bot was added to a group: introduce itself once.
  const mcm = update.my_chat_member;
  if (mcm && mcm.new_chat_member.user.id === botId() && ["member", "administrator"].includes(mcm.new_chat_member.status)
    && ["left", "kicked"].includes(mcm.old_chat_member.status) && mcm.chat.type !== "private") {
    const lang = getLang(mcm.chat.id, mcm.from?.language_code);
    after(() => sendGroupIntro(mcm.chat.id, lang));
    return new Response("ok");
  }

  const cb = update.callback_query;
  if (cb?.message) {
    const chatId = cb.message.chat.id;
    // Language buttons
    if (cb.data === "lang:ru" || cb.data === "lang:ky" || cb.data === "lang:en") {
      const lang = toLang(cb.data.slice(5));
      setLang(chatId, lang);
      after(async () => {
        await tg("answerCallbackQuery", { callback_query_id: cb.id });
        await tg("editMessageText", { chat_id: chatId, message_id: cb.message!.message_id, text: botText(lang).langChosen });
      });
      return new Response("ok");
    }
    // "This is fraud" button
    const parsed = cb.data ? parseReportData(cb.data) : null;
    if (parsed) {
      const t = botText(getLang(chatId, cb.from?.language_code));
      after(async () => {
        const indicators = reportableIndicators([parsed]);
        const ok = indicators.length > 0 && !chatTooMany(chatId, "report", 3, 20) && (await addReport(indicators[0])) !== null;
        await tg("answerCallbackQuery", { callback_query_id: cb.id, text: ok ? t.reported : t.reportFail });
        if (ok) await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message!.message_id, reply_markup: { inline_keyboard: [] } });
      });
      return new Response("ok");
    }
    after(() => tg("answerCallbackQuery", { callback_query_id: cb.id }));
    return new Response("ok");
  }

  const msg = update.message;
  if (!msg) return new Response("ok");
  const chatId = msg.chat.id;
  const lang = getLang(chatId, msg.from?.language_code);
  const t = botText(lang);
  const raw = (msg.text || msg.caption || "").trim();
  const send = (body: string, extra: Record<string, unknown> = {}) => tg("sendMessage", { chat_id: chatId, text: body, parse_mode: "HTML", ...extra });

  // Groups: silent guard mode (see lib/telegram-group.ts).
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    if (msg.from?.is_bot) return new Response("ok");
    if (raw.startsWith("/start") || raw.startsWith("/help")) {
      after(() => sendGroupIntro(chatId, lang));
      return new Response("ok");
    }
    if (raw.startsWith("/lang")) {
      after(() =>
        send(t.chooseLang, {
          reply_markup: { inline_keyboard: [[{ text: "Русский", callback_data: "lang:ru" }, { text: "Кыргызча", callback_data: "lang:ky" }, { text: "English", callback_data: "lang:en" }]] },
        }),
      );
      return new Response("ok");
    }
    const gdoc = msg.document;
    if (gdoc && (/\.apk$/i.test(gdoc.file_name ?? "") || gdoc.mime_type === "application/vnd.android.package-archive")) {
      after(() => send(t.apk, { reply_to_message_id: msg.message_id }));
      return new Response("ok");
    }
    const hiddenLinks = [...(msg.entities ?? []), ...(msg.caption_entities ?? [])].filter((e) => e.type === "text_link" && e.url).map((e) => e.url!);
    if (raw || hiddenLinks.length) after(() => guardGroupMessage(chatId, msg.message_id, raw, hiddenLinks, lang, site(req)));
    return new Response("ok");
  }

  if (raw.startsWith("/start") || raw.startsWith("/help")) {
    after(() => send(t.start));
    return new Response("ok");
  }
  if (raw.startsWith("/lang")) {
    after(() =>
      send(t.chooseLang, {
        reply_markup: { inline_keyboard: [[{ text: "Русский", callback_data: "lang:ru" }, { text: "Кыргызча", callback_data: "lang:ky" }, { text: "English", callback_data: "lang:en" }]] },
      }),
    );
    return new Response("ok");
  }

  const doc = msg.document;
  if (doc && (/\.apk$/i.test(doc.file_name ?? "") || doc.mime_type === "application/vnd.android.package-archive")) {
    after(() => send(t.apk, { reply_to_message_id: msg.message_id }));
    return new Response("ok");
  }

  // Hidden links: "нажми здесь" with the real address only in the formatting.
  const hidden = [...(msg.entities ?? []), ...(msg.caption_entities ?? [])].filter((e) => e.type === "text_link" && e.url).map((e) => e.url!);
  const text = [raw, ...hidden.filter((u) => !raw.includes(u))].join("\n").trim();
  const imageDoc = doc?.mime_type?.startsWith("image/") || doc?.mime_type === "application/pdf" ? doc : null;
  const photo = msg.photo?.length ? msg.photo[msg.photo.length - 1] : null;
  const image = imageDoc ?? photo;

  if (!text && !image) {
    after(() => send(t.unsupported));
    return new Response("ok");
  }
  if (chatTooMany(chatId)) {
    after(() => send(t.limit));
    return new Response("ok");
  }

  const base = site(req);
  after(async () => {
    const working = await tg<{ message_id: number }>("sendMessage", { chat_id: chatId, text: t.working, reply_to_message_id: msg.message_id });
    let img: { mime: string; data: string } | null = null;
    if (image) {
      const size = image.file_size ?? 0;
      const buf = size > MAX_FILE_BYTES ? null : await downloadTelegramFile(image.file_id);
      if (!buf || buf.length > MAX_FILE_BYTES) {
        await tg("editMessageText", { chat_id: chatId, message_id: working?.message_id, text: t.tooBig });
        return;
      }
      img = { mime: imageDoc?.mime_type ?? "image/jpeg", data: buf.toString("base64") };
    }
    await checkForChat(chatId, working?.message_id ?? null, { text, image: img }, lang, base);
  });
  return new Response("ok");
}
