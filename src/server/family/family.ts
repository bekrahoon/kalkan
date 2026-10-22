import "server-only";
import { randomBytes } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import { tg } from "@/server/telegram/bot";
import type { CheckResult, Lang } from "@/lib/types";
import { esc } from "@/server/telegram/html";

/*
 * "Trusted person": a vulnerable user (often an elderly parent) links a relative once.
 * When the user meets something dangerous, or writes that they already sent money or a code,
 * the relative gets a Telegram message right away. This breaks the scammers' main trick —
 * "don't tell anyone" — and help arrives in the first minutes, while money can still be stopped.
 *
 * Both sides opt in: the user creates the invite, the relative must open it.
 * Stored as small private JSON files in Vercel Blob; without a token it falls back to memory.
 */

export interface Guardian {
  chatId: number;
  name: string;
  lang: Lang;
  since: string;
}
/** The protected person: a Telegram chat id. */
export type Owner = number;
/** Parses an owner id from button data (which a modified Telegram client can forge): digits only. */
export const parseOwner = (v: string): Owner | null => (/^-?\d{1,16}$/.test(v) ? Number(v) : null);

interface Family {
  name: string;
  guardians: Guardian[];
}
/** "owner" invite: the protected person invites a relative. "ward" invite: a relative invites the person they look after. */
interface Invite {
  kind?: "owner" | "ward";
  owner: Owner;
  name: string;
  created: number;
  guardian?: Omit<Guardian, "since">;
}

const MAX_GUARDIANS = 3;
const INVITE_TTL = 7 * 86_400_000;
const enabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const memory = new Map<string, string>();

async function readJson<T>(path: string): Promise<T | null> {
  if (!enabled()) {
    const v = memory.get(path);
    return v ? (JSON.parse(v) as T) : null;
  }
  try {
    const r = await get(path, { access: "private", useCache: false });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    return JSON.parse(await new Response(r.stream).text()) as T;
  } catch (e) {
    console.warn("[family] read", (e as Error).message);
    return null;
  }
}

async function writeJson(path: string, data: unknown) {
  if (!enabled()) {
    memory.set(path, JSON.stringify(data));
    return;
  }
  await put(path, JSON.stringify(data), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
}

async function remove(path: string) {
  if (!enabled()) {
    memory.delete(path);
    return;
  }
  await del(path).catch(() => {});
}

const famPath = (owner: Owner) => `family/${owner}.json`;
const invitePath = (code: string) => `family/invites/${code}.json`;

export async function getFamily(owner: Owner): Promise<Family | null> {
  return readJson<Family>(famPath(owner));
}

export async function createInvite(owner: Owner, name: string): Promise<string> {
  const code = randomBytes(6).toString("base64url");
  await writeJson(invitePath(code), { owner, name, created: Date.now() } satisfies Invite);
  return code;
}

export async function createWardInvite(guardian: Omit<Guardian, "since">): Promise<string> {
  const code = randomBytes(6).toString("base64url");
  await writeJson(invitePath(code), { kind: "ward", owner: 0, name: guardian.name, created: Date.now(), guardian } satisfies Invite);
  return code;
}

/** The person being looked after opened a relative's invite: link that relative as their trusted person. */
export async function acceptWardInvite(code: string, owner: { chatId: number; name: string }): Promise<AcceptResult & { guardian?: Omit<Guardian, "since"> }> {
  if (!/^[\w-]{6,16}$/.test(code)) return { ok: false, reason: "invalid" };
  const inv = await readJson<Invite>(invitePath(code));
  if (!inv || inv.kind !== "ward" || !inv.guardian || Date.now() - inv.created > INVITE_TTL) return { ok: false, reason: "invalid" };
  if (inv.guardian.chatId === owner.chatId) return { ok: false, reason: "self" };
  const fam = (await getFamily(owner.chatId)) ?? { name: owner.name, guardians: [] };
  const others = fam.guardians.filter((g) => g.chatId !== inv.guardian!.chatId);
  if (others.length >= MAX_GUARDIANS) return { ok: false, reason: "full" };
  fam.guardians = [...others, { ...inv.guardian, since: new Date().toISOString() }];
  fam.name = owner.name;
  await writeJson(famPath(owner.chatId), fam);
  await remove(invitePath(code));
  return { ok: true, ownerId: owner.chatId, ownerName: owner.name, guardian: inv.guardian };
}

export type AcceptResult = { ok: true; ownerId: Owner; ownerName: string } | { ok: false; reason: "invalid" | "self" | "full" };

export async function acceptInvite(code: string, guardian: Omit<Guardian, "since">): Promise<AcceptResult> {
  if (!/^[\w-]{6,16}$/.test(code)) return { ok: false, reason: "invalid" };
  const inv = await readJson<Invite>(invitePath(code));
  if (!inv || Date.now() - inv.created > INVITE_TTL) return { ok: false, reason: "invalid" };
  if (inv.owner === guardian.chatId) return { ok: false, reason: "self" };
  const fam = (await getFamily(inv.owner)) ?? { name: inv.name, guardians: [] };
  const others = fam.guardians.filter((g) => g.chatId !== guardian.chatId);
  if (others.length >= MAX_GUARDIANS) return { ok: false, reason: "full" };
  fam.guardians = [...others, { ...guardian, since: new Date().toISOString() }];
  fam.name = inv.name;
  await writeJson(famPath(inv.owner), fam);
  await remove(invitePath(code));
  return { ok: true, ownerId: inv.owner, ownerName: inv.name };
}

export async function removeGuardian(owner: Owner, guardianId: number): Promise<Guardian | null> {
  const fam = await getFamily(owner);
  const g = fam?.guardians.find((x) => x.chatId === guardianId);
  if (!fam || !g) return null;
  fam.guardians = fam.guardians.filter((x) => x.chatId !== guardianId);
  if (fam.guardians.length) await writeJson(famPath(owner), fam);
  else await remove(famPath(owner));
  return g;
}

/* ---------------- "I already sent money / told the code" ---------------- */

const PANIC = [
  /(?:перев[её]л[аи]?|перечислил[аи]?|отправил[аи]?|скинул[аи]?|оплатил[аи]?)\s+(?!тебе|вам|вас|тебя|ему|ей)(?:[\p{L}\d]+\s+){0,3}(?:деньги|денег|деньгами|сом|сумм|на\s+карт)/iu,
  /(?:назвал[аи]?|сказал[аи]?|продиктовал[аи]?|отправил[аи]?|ввел[аи]?|ввёл)\s+(?:\p{L}+\s+){0,3}(?:код|пароль|cvv|данные\s+карт)/iu,
  /меня\s+(?:обманули|развели|взломали)|я\s+(?:попал[аи]?\s+на\s+мошенник|отдал[аи]?\s+деньги)/iu,
  /акча(?:ны)?\s+котор(?:дум|уп\s+жибердим|уп\s+койдум)|кодду\s+айтып\s+(?:койдум|бердим)|мени\s+алдап\s+кет/iu,
  /\bi\s+(?:already\s+)?(?:sent|transferred|paid)\s+(?:\p{L}+\s+){0,2}(?:money|them)|\bi\s+(?:gave|told|sent)\s+(?:them\s+)?(?:the\s+)?(?:code|password)|i\s+(?:got|was)\s+scammed/iu,
];
/** Only the user's own words count: forwarded scam texts ("I sent you money by mistake…") must not raise an alarm. */
export const isPanic = (text: string) => text.length <= 400 && PANIC.some((re) => re.test(text));

/* ---------------- texts ---------------- */


const T = {
  ru: {
    intro:
      "👨‍👩‍👧 <b>Доверенное лицо</b>\n\nЕсли тебе придёт опасное сообщение или ты напишешь, что уже перевёл деньги или назвал код, я сразу предупрежу близкого человека — сына, дочь, внука. Он сможет позвонить и помочь, пока деньги ещё можно остановить.\n\nПерешли ему следующее сообщение 👇 Когда он нажмёт на ссылку, он станет твоим доверенным лицом.",
    invite: (name: string, link: string) => `Привет! Это ${esc(name)}. Стань моим доверенным лицом в KalkanCheck: если мне напишут мошенники, тебе сразу придёт сообщение.\n\nНажми: ${link}`,
    current: "Сейчас твои доверенные лица:",
    none: "Пока доверенных лиц нет.",
    removeBtn: (n: string) => `Убрать: ${n}`,
    removed: (n: string) => `${n} больше не получает предупреждения.`,
    acceptedGuardian: (n: string) =>
      `✅ Теперь ты доверенное лицо для <b>${esc(n)}</b>.\n\nЕсли ${esc(n)} получит опасное сообщение или напишет, что уже перевёл(а) деньги, я сразу сообщу тебе. Ты тоже можешь проверять у меня любые ссылки и сообщения.`,
    acceptedOwner: (n: string) => `✅ <b>${esc(n)}</b> теперь твоё доверенное лицо. Если что-то случится, я сразу дам знать.`,
    inviteInvalid: "Это приглашение уже не действует. Попроси прислать новое: команда /family.",
    inviteSelf: "Это твоё собственное приглашение — перешли его близкому человеку.",
    inviteFull: "У этого человека уже 3 доверенных лица — это максимум.",
    alertDanger: (owner: string, r: CheckResult) =>
      `⚠️ <b>${esc(owner)}</b> только что получил(а) опасное сообщение.\n\nKalkanCheck: <b>${esc(r.title)}</b>\n<i>${esc(r.subject)}</i>\n\nПозвони и спокойно спроси: не переводил(а) ли деньги и не называл(а) ли коды из SMS. Мошенники часто просят «никому не говорить».`,
    alertPanic: (owner: string, said: string) =>
      `🚨 <b>СРОЧНО: ${esc(owner)}</b> пишет, что, возможно, уже перевёл(а) деньги или назвал(а) код:\n\n«${esc(said)}»\n\nПозвони прямо сейчас. Первое, что нужно сделать, — позвонить в банк по номеру на обороте карты и заблокировать карту.`,
    leaveBtn: "Больше не получать",
    left: (n: string) => `Готово, предупреждения для «${esc(n)}» отключены.`,
    told: (names: string) => `👨‍👩‍👧 Я предупредил твоих близких: ${esc(names)}.`,
    suggest: "👨‍👩‍👧 Чтобы в такой ситуации я сразу предупреждал близкого человека, добавь доверенное лицо: /family",
    wardIntro:
      "👨‍👩‍👧 <b>Стань доверенным лицом для близкого</b>\n\nПерешли следующее сообщение маме, папе или бабушке 👇 Когда они нажмут на ссылку, KalkanCheck будет проверять то, что им пришлют, и сразу напишет тебе, если что-то опасное или они уже перевели деньги.",
    wardInvite: (name: string, link: string) =>
      `Привет! Это ${esc(name)}. Подключи, пожалуйста, KalkanCheck — он проверяет ссылки и сообщения на мошенников. Если тебе напишут мошенники, он сразу сообщит мне.\n\nНажми: ${link}\n\nПотом просто пересылай ему подозрительные сообщения.`,
    wardAccepted: (g: string) =>
      `✅ Готово! <b>${esc(g)}</b> теперь твоё доверенное лицо.\n\nПересылай мне любые подозрительные сообщения, ссылки и скриншоты — я проверю. Если что-то опасное, я сразу дам знать: ${esc(g)}.`,
    wardGuardianNote: (o: string) => `✅ <b>${esc(o)}</b> подключил(а) KalkanCheck. Теперь ты доверенное лицо и получишь сообщение, если что-то случится.`,
    sosBtn: "🆘 Я уже перевёл деньги / назвал код",
    sos: "🆘 <b>Действуй прямо сейчас</b>\n\n1. Позвони в банк по номеру на обороте карты и заблокируй карту. Скажи, что это мошенничество, и попроси отменить перевод.\n2. Если назвал код от Telegram или WhatsApp — Настройки → Устройства → «Завершить все другие сеансы», потом смени пароль.\n3. Больше ничего не переводи и не отвечай мошенникам.\n4. Сохрани переписку и чеки и позвони в милицию: 102.",
  },
  ky: {
    intro:
      "👨‍👩‍👧 <b>Ишенимдүү адам</b>\n\nЭгер сага коркунучтуу билдирүү келсе же акча которуп койгонуңду, кодду айтып койгонуңду жазсаң, мен дароо жакын адамыңды — уулуңду, кызыңды, небереңди эскертем. Ал акчаны токтотууга мүмкүн болгондо чалып, жардам бере алат.\n\nКийинки билдирүүнү ага жөнөт 👇 Ал шилтемени басканда, сенин ишенимдүү адамың болот.",
    invite: (name: string, link: string) => `Салам! Бул ${esc(name)}. KalkanCheckте менин ишенимдүү адамым бол: мага алдамчылар жазса, сага дароо билдирүү келет.\n\nБас: ${link}`,
    current: "Азыр сенин ишенимдүү адамдарың:",
    none: "Азырынча ишенимдүү адам жок.",
    removeBtn: (n: string) => `Алып салуу: ${n}`,
    removed: (n: string) => `${n} мындан ары эскертүү албайт.`,
    acceptedGuardian: (n: string) =>
      `✅ Эми сен <b>${esc(n)}</b> үчүн ишенимдүү адамсың.\n\nЭгер ага коркунучтуу билдирүү келсе же акча которуп койгонун жазса, мен сага дароо билдирем. Сен да мага каалаган шилтемени жана билдирүүнү текшертсең болот.`,
    acceptedOwner: (n: string) => `✅ <b>${esc(n)}</b> эми сенин ишенимдүү адамың. Бир нерсе болсо, ага дароо жазам.`,
    inviteInvalid: "Бул чакыруу мындан ары иштебейт. Жаңысын жөнөтүүнү сура: /family буйругу.",
    inviteSelf: "Бул сенин өзүңдүн чакыруун — аны жакын адамыңа жөнөт.",
    inviteFull: "Бул адамдын 3 ишенимдүү адамы бар — бул эң көп саны.",
    alertDanger: (owner: string, r: CheckResult) =>
      `⚠️ <b>${esc(owner)}</b> азыр эле коркунучтуу билдирүү алды.\n\nKalkanCheck: <b>${esc(r.title)}</b>\n<i>${esc(r.subject)}</i>\n\nЧалып, акырын сура: акча которгон жокпу, SMS коддорун айткан жокпу. Алдамчылар көбүнчө «эч кимге айтпа» деп суранышат.`,
    alertPanic: (owner: string, said: string) =>
      `🚨 <b>ШАШЫЛЫШ: ${esc(owner)}</b> акча которуп же кодду айтып койгон болушу мүмкүн экенин жазып жатат:\n\n«${esc(said)}»\n\nДал азыр чал. Биринчи кезекте картанын артындагы номер аркылуу банкка чалып, картаны бөгөттөө керек.`,
    leaveBtn: "Мындан ары албоо",
    left: (n: string) => `Сен мындан ары ${esc(n)} тууралуу эскертүү албайсың.`,
    told: (names: string) => `👨‍👩‍👧 Жакындарыңды эскерттим: ${esc(names)}.`,
    suggest: "👨‍👩‍👧 Мындай учурда жакын адамыңды дароо эскертишим үчүн ишенимдүү адам кош: /family",
    wardIntro:
      "👨‍👩‍👧 <b>Жакыныңдын ишенимдүү адамы бол</b>\n\nКийинки билдирүүнү апаңа, атаңа же чоң энеңе жөнөт 👇 Алар шилтемени басканда, KalkanCheck аларга келгенди текшерип, коркунучтуу нерсе болсо же акча которуп койсо, сага дароо жазат.",
    wardInvite: (name: string, link: string) =>
      `Салам! Бул ${esc(name)}. KalkanCheckти туташтырып алчы — ал шилтемелерди жана билдирүүлөрдү алдамчылыкка текшерет. Сага алдамчылар жазса, мага дароо билдирет.\n\nБас: ${link}\n\nАндан кийин шектүү билдирүүлөрдү ага жөнөтүп тур.`,
    wardAccepted: (g: string) =>
      `✅ Даяр! <b>${esc(g)}</b> эми сенин ишенимдүү адамың.\n\nМага шектүү билдирүүлөрдү, шилтемелерди жана скриншотторду жөнөт — текшерем. Коркунучтуу нерсе болсо, дароо билдирем: ${esc(g)}.`,
    wardGuardianNote: (o: string) => `✅ <b>${esc(o)}</b> KalkanCheckти туташтырды. Эми сен ишенимдүү адамсың жана бир нерсе болсо билдирүү аласың.`,
    sosBtn: "🆘 Акча которуп / кодду айтып койдум",
    sos: "🆘 <b>Дал азыр аракет кыл</b>\n\n1. Картанын артындагы номер аркылуу банкка чалып, картаны бөгөттө. Бул алдамчылык экенин айтып, которууну жокко чыгарууну сура.\n2. Telegram же WhatsApp кодун айтып койсоң — Жөндөөлөр → Түзмөктөр → «Башка бардык сеанстарды бүтүрүү», андан кийин сырсөздү алмаштыр.\n3. Мындан ары эч нерсе которбо жана алдамчыларга жооп бербе.\n4. Кат алышууну жана чектерди сактап, милицияга чал: 102.",
  },
  en: {
    intro:
      "👨‍👩‍👧 <b>Trusted person</b>\n\nIf you get a dangerous message, or write that you already sent money or told a code, I'll immediately warn someone close to you — a son, daughter or grandchild. They can call and help while the money can still be stopped.\n\nForward them the next message 👇 When they tap the link, they become your trusted person.",
    invite: (name: string, link: string) => `Hi! It's ${esc(name)}. Be my trusted person in KalkanCheck: if scammers write to me, you'll get a message right away.\n\nTap: ${link}`,
    current: "Your trusted people now:",
    none: "No trusted people yet.",
    removeBtn: (n: string) => `Remove: ${n}`,
    removed: (n: string) => `${n} no longer gets warnings.`,
    acceptedGuardian: (n: string) =>
      `✅ You are now the trusted person for <b>${esc(n)}</b>.\n\nIf they get a dangerous message or write that they already sent money, I'll tell you right away. You can also check any links and messages with me.`,
    acceptedOwner: (n: string) => `✅ <b>${esc(n)}</b> is now your trusted person. If something happens, I'll message them right away.`,
    inviteInvalid: "This invitation no longer works. Ask for a new one: the /family command.",
    inviteSelf: "This is your own invitation — forward it to someone close to you.",
    inviteFull: "This person already has 3 trusted people — that's the maximum.",
    alertDanger: (owner: string, r: CheckResult) =>
      `⚠️ <b>${esc(owner)}</b> just received a dangerous message.\n\nKalkanCheck: <b>${esc(r.title)}</b>\n<i>${esc(r.subject)}</i>\n\nCall and calmly ask whether they sent any money or shared SMS codes. Scammers often say “don't tell anyone”.`,
    alertPanic: (owner: string, said: string) =>
      `🚨 <b>URGENT: ${esc(owner)}</b> writes that they may have already sent money or told a code:\n\n“${esc(said)}”\n\nCall right now. The first step is to call the bank on the number on the back of the card and block it.`,
    leaveBtn: "Stop these alerts",
    left: (n: string) => `Done, warnings for “${esc(n)}” are turned off.`,
    told: (names: string) => `👨‍👩‍👧 I've warned your family: ${esc(names)}.`,
    suggest: "👨‍👩‍👧 So that I warn someone close to you in a situation like this, add a trusted person: /family",
    wardIntro:
      "👨‍👩‍👧 <b>Become a trusted person for someone close</b>\n\nForward the next message to your mum, dad or grandparent 👇 When they tap the link, KalkanCheck will check what they're sent and message you right away if something is dangerous or they already sent money.",
    wardInvite: (name: string, link: string) =>
      `Hi! It's ${esc(name)}. Please connect KalkanCheck — it checks links and messages for scams. If scammers write to you, it will tell me right away.\n\nTap: ${link}\n\nThen just forward suspicious messages to it.`,
    wardAccepted: (g: string) =>
      `✅ Done! <b>${esc(g)}</b> is now your trusted person.\n\nForward me any suspicious messages, links and screenshots — I'll check them. If something is dangerous, I'll let ${esc(g)} know right away.`,
    wardGuardianNote: (o: string) => `✅ <b>${esc(o)}</b> connected KalkanCheck. You are now their trusted person and will get a message if something happens.`,
    sosBtn: "🆘 I already sent money / told the code",
    sos: "🆘 <b>Act right now</b>\n\n1. Call your bank on the number on the back of your card and block it. Say it's fraud and ask to cancel the transfer.\n2. If you told a Telegram or WhatsApp code — Settings → Devices → “Terminate all other sessions”, then change your password.\n3. Don't send anything else and don't reply to the scammers.\n4. Keep the chat and receipts and call the police: 102.",
  },
} satisfies Record<Lang, unknown>;

export const familyText = (lang: Lang) => T[lang];

/** Sends a warning to everyone who agreed to look after this user. Returns the names of those warned. */
export async function alertGuardians(owner: Owner, ownerName: string, kind: { danger: CheckResult } | { panic: string }): Promise<string[]> {
  const fam = await getFamily(owner);
  if (!fam?.guardians.length) return [];
  const name = ownerName || fam.name;
  const sent = await Promise.all(
    fam.guardians.map(async (g) => {
      const t = T[g.lang] ?? T.ru;
      const text = "danger" in kind ? t.alertDanger(name, kind.danger) : t.alertPanic(name, kind.panic.slice(0, 300));
      const ok = await tg("sendMessage", {
        chat_id: g.chatId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: { inline_keyboard: [[{ text: t.leaveBtn, callback_data: `fam:leave:${owner}` }]] },
      });
      return ok ? g.name : null;
    }),
  );
  return sent.filter((n): n is string => Boolean(n));
}
