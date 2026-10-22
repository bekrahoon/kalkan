import { botToken, tg, webhookSecret } from "@/server/telegram/bot";

/**
 * One-time bot setup (re-run after changing the domain or the token):
 *   GET /api/telegram/setup?key=ADMIN_KEY
 * Points the Telegram webhook to this site and sets the bot's commands and descriptions.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!process.env.ADMIN_KEY || u.searchParams.get("key") !== process.env.ADMIN_KEY) return new Response("Not found", { status: 404 });
  if (!botToken()) return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 400 });

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const webhook = await tg("setWebhook", {
    url: `https://${host}/api/telegram`,
    secret_token: webhookSecret(),
    allowed_updates: ["message", "callback_query", "my_chat_member"],
    drop_pending_updates: true,
  });
  const me = await tg<{ username: string }>("getMe", {});
  await tg("setMyCommands", { commands: [{ command: "start", description: "Как пользоваться" }, { command: "family", description: "Доверенное лицо / Ишенимдүү адам" }, { command: "lang", description: "Язык / Тил / Language" }] });
  await tg("setMyDescription", {
    description:
      "KalkanCheck проверяет ссылки, сообщения, номера и скриншоты на мошенничество. Перешли подозрительное сообщение — отвечу за пару секунд.\n\nKalkanCheck шилтемелерди, билдирүүлөрдү, номерлерди жана скриншотторду алдамчылыкка текшерет.\n\nKalkanCheck checks links, messages and screenshots for scams in a couple of seconds.",
  });
  await tg("setMyShortDescription", { short_description: "Проверь, прежде чем нажать: ссылки, сообщения и номера на мошенничество. RU / KG / EN." });
  await tg("setMyName", { name: "KalkanCheck" });
  const info = await tg("getWebhookInfo", {});
  return Response.json({ ok: Boolean(webhook), bot: me?.username, webhook: info });
}
