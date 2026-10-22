import "server-only";
import { runCheck, findUrls } from "@/server/check";
import { checkLink } from "@/server/check/link";
import { botToken, chatTooMany, tg } from "./bot";
import type { CheckResult, Lang } from "@/lib/types";

/*
 * "Chat guard": added to a family, class or neighbours' group, the bot stays silent
 * and speaks up only when someone posts a dangerous link or a typical scam message.
 * People don't need to remember to check anything — that is the whole point.
 */

export const botId = () => Number(botToken().split(":")[0]) || 0;

/** Cheap pre-filter so the AI only reads messages that look like a known scheme. */
const SCAM_WORDS =
  /(код из (смс|sms)|продиктуй|назови код|проголосуй|голосован|добуш бер|служба безопасности|безопасный сч[её]т|перевед[иь]|перевод на карту|выиграл|ваш приз|компенсац|cvv|cvc|предоплат|заработ\S* в день|инвестиц|sms код|акча котор|утуп алдыңыз|verification code|security service|you (?:have )?won|vote for)/i;

const T = {
  ru: {
    intro:
      "🛡 <b>KalkanCheck охраняет этот чат.</b>\n\nЯ молча проверяю ссылки и подозрительные сообщения и пишу, только если нашёл опасность. Ничего настраивать не нужно.",
    title: "⚠️ <b>Осторожно, похоже на мошенников</b>",
    footer: "Не переходите по ссылке, не вводите данные и не переводите деньги.",
    more: "Подробнее",
  },
  ky: {
    intro:
      "🛡 <b>KalkanCheck бул чатты коргойт.</b>\n\nШилтемелерди жана шектүү билдирүүлөрдү унчукпай текшерем, коркунуч тапсам гана жазам. Эч нерсе жөндөөнүн кереги жок.",
    title: "⚠️ <b>Этият болгула, алдамчыларга окшойт</b>",
    footer: "Шилтемеге өтпөгүлө, маалымат киргизбегиле жана акча которбогула.",
    more: "Кененирээк",
  },
  en: {
    intro:
      "🛡 <b>KalkanCheck is guarding this chat.</b>\n\nI quietly check links and suspicious messages and write only if I find a danger. Nothing to set up.",
    title: "⚠️ <b>Careful, this looks like a scam</b>",
    footer: "Don’t open the link, don’t enter any data and don’t send money.",
    more: "More",
  },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendGroupIntro(chatId: number, lang: Lang) {
  await tg("sendMessage", { chat_id: chatId, text: T[lang].intro, parse_mode: "HTML" });
}

function warning(r: CheckResult, lang: Lang): string {
  const t = T[lang];
  const reasons = r.signals.filter((s) => s.level === "bad" || s.level === "warn").slice(0, 3);
  const lines = [t.title, `<b>${esc(r.subject)}</b> — ${esc(r.title)}`];
  if (reasons.length) lines.push("", ...reasons.map((s) => `• ${esc(s.text)}`));
  lines.push("", t.footer, "— 🛡 KalkanCheck");
  return lines.join("\n");
}

/** Checks one group message; replies only when there is a real warning. */
export async function guardGroupMessage(chatId: number, messageId: number, text: string, hiddenLinks: string[], lang: Lang, site: string) {
  if (chatTooMany(chatId, "group", 30, 400)) return;
  const urls = [...new Set([...findUrls(text), ...hiddenLinks])].slice(0, 3);

  let found: CheckResult | null = null;
  for (const u of urls) {
    const r = await checkLink(u, lang, { ai: false }).catch(() => null);
    // In a group, stay quiet unless it is clearly bad: false alarms would make people mute the bot.
    if (r && (r.verdict === "danger" || (r.verdict === "suspicious" && r.reports > 0))) {
      found = r;
      break;
    }
  }
  if (!found && text.length >= 40 && SCAM_WORDS.test(text) && !chatTooMany(chatId, "group-ai", 10, 60)) {
    const r = await runCheck({ text }, lang).catch(() => null);
    if (r?.verdict === "danger") found = r;
  }
  if (!found) return;

  const more = found.kind === "link" ? `${site}/?check=${encodeURIComponent(urls[0])}` : site;
  await tg("sendMessage", {
    chat_id: chatId,
    text: warning(found, lang),
    parse_mode: "HTML",
    reply_to_message_id: messageId,
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: [[{ text: T[lang].more, url: more }]] },
  });
}
