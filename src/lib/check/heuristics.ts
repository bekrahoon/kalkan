import type { Lang, Signal, Verdict } from "../types";

/*
 * Plain-rule backup for messages when the AI is slow or down.
 * Only classic, unambiguous scam patterns score points, so a normal chat message stays "unknown".
 */

interface Rule {
  re: RegExp;
  points: number;
  text: Record<Lang, string>;
}

const RULES: Rule[] = [
  {
    re: /(код\w*|пароль)[^.!?\n]{0,40}(смс|sms|сообщени)|(смс|sms)[^.!?\n]{0,25}код|(назов|продикту|сообщ|скаж|отправ)\w*[^.!?\n]{0,20}(код|пароль)|cvv|cvc|пин-?код|смс.{0,10}код/i,
    points: 3,
    text: {
      ru: "Просят код из СМС, пароль или данные карты — так пишут только мошенники",
      ky: "СМСтеги кодду, сырсөздү же карта маалыматын сурашат — муну алдамчылар гана жазат",
      en: "Asks for an SMS code, password or card details — only scammers do this",
    },
  },
  {
    re: /карт\w*[^.!?\n]{0,30}(заблокир|блокир|арест)|(заблокир|блокир)\w*[^.!?\n]{0,30}(карт|счет|счёт)|служб\w* безопасност|подозрительн\w* (операц|перевод|вход)|card (is )?(blocked|suspended)|security (service|team)/i,
    points: 2,
    text: {
      ru: "Пугают блокировкой карты или «службой безопасности банка»",
      ky: "Картаны бөгөттөө же «банктын коопсуздук кызматы» менен коркутушат",
      en: "Scares you with a blocked card or the bank's \"security service\"",
    },
  },
  {
    re: /(переведи|перевед[иёе]т?е?|скин[ьу]\w*|отправ[ьи]\w*)[^.!?\n]{0,30}(деньг|сом|руб|на карт|на номер|\d{3,})|одолжи[^.!?\n]{0,20}(деньг|\d)|акча\w* (котор|жөнөт)|send (me )?money/i,
    points: 2,
    text: {
      ru: "Просят перевести деньги",
      ky: "Акча которууну суранышат",
      en: "Asks you to send money",
    },
  },
  {
    re: /выигр\w*|приз(?![а-яё])|призов|розыгрыш|компенсац|положен\w* выплат|бесплатн\w* (деньг|выплат)|you (have )?won|prize/i,
    points: 2,
    text: {
      ru: "Обещают выигрыш, приз или выплату",
      ky: "Утуш, сыйлык же төлөм убада кылышат",
      en: "Promises a prize, win or payout",
    },
  },
  {
    re: /срочно|немедленно|в течени[ие] \d+ ?(мин|час)|последн\w* (шанс|предупрежд)|тез арада|urgent|immediately/i,
    points: 1,
    text: {
      ru: "Торопят: «срочно», «немедленно»",
      ky: "Шаштырышат: «тез», «дароо»",
      en: "Rushes you: \"urgent\", \"immediately\"",
    },
  },
  {
    re: /\b(bit\.ly|tinyurl\.com|clck\.ru|cutt\.ly|t\.ly|goo\.su|is\.gd|surl\.li|rb\.gy)\//i,
    points: 1,
    text: {
      ru: "Ссылка через сокращатель — не видно, куда она ведёт",
      ky: "Шилтеме кыскарткыч аркылуу — кайда алып барары көрүнбөйт",
      en: "Shortened link — you can't see where it leads",
    },
  },
];

export function scamHeuristics(text: string, lang: Lang): { verdict: Verdict; signals: Signal[] } {
  let score = 0;
  const signals: Signal[] = [];
  // Real bank SMS: "code 1234, do not tell it to anyone" is a warning, not a request.
  const codeWarning = /никому|не сообщайте|не говори|не передавайте|эч кимге|do not share|never share|don't share/i.test(text);
  for (const r of RULES) {
    if (!r.re.test(text)) continue;
    if (codeWarning && r === RULES[0]) continue;
    score += r.points;
    signals.push({ level: r.points >= 2 ? "bad" : "warn", text: r.text[lang] });
  }
  // A link plus any money/code pressure is the classic phishing pair.
  if (score >= 2 && /https?:\/\/|www\./i.test(text)) score += 1;
  const verdict: Verdict = score >= 4 ? "danger" : score >= 2 ? "suspicious" : "unknown";
  return { verdict, signals: verdict === "unknown" ? [] : signals };
}
