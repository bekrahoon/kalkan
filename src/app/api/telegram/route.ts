import { after } from "next/server";
import {
  analyzeForChat,
  botText,
  botToken,
  chatTooMany,
  downloadTelegramFile,
  getLang,
  setLang,
  tg,
  webhookSecret,
} from "@/lib/telegram";
import { MAX_FILE_BYTES } from "@/lib/types";
import type { AnalysisInput } from "@/lib/pipeline";

/** Analysis runs after we answer Telegram (it waits only a few seconds for webhooks). */
export const maxDuration = 300;

interface TgMessage {
  message_id: number;
  chat: { id: number };
  from?: { language_code?: string };
  text?: string;
  caption?: string;
  document?: { file_id: string; mime_type?: string; file_size?: number };
  photo?: { file_id: string; file_size?: number; width: number }[];
}
interface TgUpdate {
  message?: TgMessage;
  callback_query?: { id: string; data?: string; message?: { chat: { id: number }; message_id: number } };
}

const site = (req: Request) => `https://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;

export async function POST(req: Request) {
  if (!botToken() || req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) {
    return new Response("Not found", { status: 404 });
  }
  const update = (await req.json().catch(() => ({}))) as TgUpdate;

  // Language buttons
  const cb = update.callback_query;
  if (cb?.message && (cb.data === "lang:ru" || cb.data === "lang:ky")) {
    const lang = cb.data === "lang:ky" ? "ky" : "ru";
    setLang(cb.message.chat.id, lang);
    after(async () => {
      await tg("answerCallbackQuery", { callback_query_id: cb.id });
      await tg("editMessageText", { chat_id: cb.message!.chat.id, message_id: cb.message!.message_id, text: botText(lang).langChosen });
    });
    return new Response("ok");
  }

  const msg = update.message;
  if (!msg) return new Response("ok");
  const chatId = msg.chat.id;
  const lang = getLang(chatId, msg.from?.language_code);
  const t = botText(lang);
  const text = (msg.text || msg.caption || "").trim();
  const send = (body: string, extra: Record<string, unknown> = {}) =>
    tg("sendMessage", { chat_id: chatId, text: body, parse_mode: "HTML", ...extra });

  if (text.startsWith("/start") || text.startsWith("/help")) {
    after(() => send(t.start));
    return new Response("ok");
  }
  if (text.startsWith("/lang")) {
    after(() =>
      send(t.chooseLang, {
        reply_markup: { inline_keyboard: [[{ text: "Русский", callback_data: "lang:ru" }, { text: "Кыргызча", callback_data: "lang:ky" }]] },
      }),
    );
    return new Response("ok");
  }

  // What did the user send?
  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/i);
  const pdf = msg.document && (msg.document.mime_type === "application/pdf" || msg.document.mime_type?.startsWith("image/")) ? msg.document : null;
  const photo = msg.photo?.length ? msg.photo[msg.photo.length - 1] : null;
  const kind = pdf || photo ? "file" : urlMatch ? "url" : text.length >= 200 ? "text" : null;

  if (!kind) {
    after(() => send(t.hint));
    return new Response("ok");
  }
  if (chatTooMany(chatId)) {
    after(() => send(t.limit));
    return new Response("ok");
  }

  const base = site(req);
  after(async () => {
    const working = await tg<{ message_id: number }>("sendMessage", { chat_id: chatId, text: t.working, reply_to_message_id: msg.message_id });
    let input: AnalysisInput;
    if (kind === "file") {
      const fileId = (pdf ?? photo)!.file_id;
      const size = (pdf ?? photo)!.file_size ?? 0;
      const buf = size > MAX_FILE_BYTES ? null : await downloadTelegramFile(fileId);
      if (!buf || buf.length > MAX_FILE_BYTES) {
        await tg("editMessageText", { chat_id: chatId, message_id: working?.message_id, text: t.tooBig });
        return;
      }
      input = { kind: "file", mime: pdf?.mime_type ?? "image/jpeg", data: buf.toString("base64") };
    } else if (kind === "url") {
      input = { kind: "url", url: urlMatch![0].replace(/[).,;!?»]+$/, "") };
    } else {
      input = { kind: "text", text };
    }
    await analyzeForChat(chatId, working?.message_id ?? null, input, lang, base);
  });
  return new Response("ok");
}
