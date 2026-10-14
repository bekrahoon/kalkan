import type { Lang } from "./types";

/**
 * Plain-language meaning of the Android permission groups Google Play lists (it shows them in Russian).
 * Matched by keyword so small wording changes on Play still work.
 */
export type PermRisk = "high" | "medium" | "low";

interface PermInfo {
  match: RegExp;
  risk: PermRisk;
  text: Record<Lang, string>;
}

const PERMS: PermInfo[] = [
  {
    match: /местополож|геолокац|location/i,
    risk: "high",
    text: {
      ru: "Видит, где ты находишься. Вместе с историей это показывает, где ты живёшь и работаешь.",
      ky: "Кайда экениңди көрөт. Тарых менен бирге кайда жашап, кайда иштээриңди көрсөтөт.",
    },
  },
  {
    match: /контакт|contacts/i,
    risk: "high",
    text: {
      ru: "Читает всю записную книжку: имена и номера людей, которые не давали согласия.",
      ky: "Бүт телефон китепчесин окуйт: макулдук бербеген адамдардын аттары жана номерлери.",
    },
  },
  {
    match: /sms|смс/i,
    risk: "high",
    text: {
      ru: "Читает SMS, в том числе коды подтверждения от банков.",
      ky: "SMSтерди окуйт, анын ичинде банктардын тастыктоо коддорун.",
    },
  },
  {
    match: /журнал звонков|вызов|call log/i,
    risk: "high",
    text: {
      ru: "Видит, кому и когда ты звонишь.",
      ky: "Кимге жана качан чалганыңды көрөт.",
    },
  },
  {
    match: /микрофон|microphone|запис.* звука/i,
    risk: "high",
    text: {
      ru: "Может записывать звук. Нужно для голосовых, но опасно, если доступ есть всегда.",
      ky: "Үн жаза алат. Үн билдирүүлөр үчүн керек, бирок дайыма уруксат болсо коркунучтуу.",
    },
  },
  {
    match: /камер|camera/i,
    risk: "medium",
    text: {
      ru: "Может снимать фото и видео. Обычно нужно для звонков и сканирования.",
      ky: "Сүрөт жана видео тарта алат. Адатта чалуулар жана сканерлөө үчүн керек.",
    },
  },
  {
    match: /датчик|sensor|здоров|health|физическ/i,
    risk: "high",
    text: {
      ru: "Получает данные с датчиков тела или о здоровье.",
      ky: "Дене датчиктеринен же ден соолук тууралуу маалымат алат.",
    },
  },
  {
    match: /календар|calendar/i,
    risk: "medium",
    text: {
      ru: "Видит твои встречи и планы.",
      ky: "Жолугушууларыңды жана пландарыңды көрөт.",
    },
  },
  {
    match: /фото|мультимед|файл|хранилищ|storage|media/i,
    risk: "medium",
    text: {
      ru: "Доступ к фото, видео и файлам на телефоне.",
      ky: "Телефондогу сүрөттөргө, видеолорго жана файлдарга кирүү.",
    },
  },
  {
    match: /идентификац|аккаунт|account|identity/i,
    risk: "medium",
    text: {
      ru: "Видит аккаунты на телефоне (например, Google) и может связать их с тобой.",
      ky: "Телефондогу аккаунттарды (мисалы, Google) көрөт жана аларды сага байланыштыра алат.",
    },
  },
  {
    match: /идентификатор устройства|device id|телефон|phone/i,
    risk: "medium",
    text: {
      ru: "Видит номер телефона и уникальный номер устройства — по нему тебя узнают в разных приложениях.",
      ky: "Телефон номерин жана түзмөктүн уникалдуу номерин көрөт — ал аркылуу сени башка тиркемелерде тааныйт.",
    },
  },
  {
    match: /wi-?fi|сеть|network|bluetooth/i,
    risk: "low",
    text: {
      ru: "Видит сети вокруг. Нужно для связи, но может уточнять местоположение.",
      ky: "Айланадагы тармактарды көрөт. Байланыш үчүн керек, бирок жайгашкан жерди тактай алат.",
    },
  },
];

export function explainPermission(name: string, lang: Lang): { risk: PermRisk; text: string } {
  const hit = PERMS.find((p) => p.match.test(name));
  return hit ? { risk: hit.risk, text: hit.text[lang] } : { risk: "low", text: "" };
}

const ORDER: Record<PermRisk, number> = { high: 0, medium: 1, low: 2 };
export function sortPermissions(names: string[], lang: Lang) {
  return names
    .map((name) => ({ name, ...explainPermission(name, lang) }))
    .sort((a, b) => ORDER[a.risk] - ORDER[b.risk]);
}
