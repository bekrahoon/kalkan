import type { CheckResult, DemoId, Lang } from "./types";

/*
 * Prepared examples for the demo buttons: they work instantly, offline and without the AI.
 * The domains are made up for the demo.
 */

export const DEMO_IDS: DemoId[] = ["bank", "voting", "real"];

export const DEMO_INPUTS: Record<DemoId, string> = {
  bank: "https://mbank-bonus.top/login",
  voting: "Привет! Проголосуй, пожалуйста, за мою племянницу в конкурсе, очень нужно 🙏 https://golos-konkurs.online/vote",
  real: "https://optimabank.kg",
};

export const isDemoId = (v: unknown): v is DemoId => typeof v === "string" && (DEMO_IDS as string[]).includes(v);

const base = { indicators: [] as CheckResult["indicators"], reports: 0, links: [] as CheckResult[], demo: true };

const RU: Record<DemoId, CheckResult> = {
  bank: {
    ...base,
    kind: "link",
    lang: "ru",
    verdict: "danger",
    title: "Поддельный сайт MBANK",
    summary: "Сайт притворяется MBANK, чтобы получить данные твоей карты и код из SMS. С этими данными мошенники снимут деньги.",
    subject: "mbank-bonus.top",
    scheme: "phishing",
    signals: [
      { level: "bad", text: "Адрес подделывает MBANK, но это не официальный сайт. Настоящий адрес — mbank.kg." },
      { level: "bad", text: "Сайт создан всего 3 дн. назад. Мошеннические сайты почти всегда новые." },
      { level: "bad", text: "Страница выдаёт себя за MBANK и просит номер карты, срок действия и код из SMS." },
      { level: "warn", text: "Доменная зона .top дешёвая и часто используется для фишинга." },
    ],
    advice: [
      "Не вводи на этом сайте никаких данных.",
      "Заходи в MBANK только через официальное приложение.",
      "Если уже ввёл данные карты — сразу позвони в банк и заблокируй карту.",
    ],
    facts: [
      { label: "Адрес", value: "mbank-bonus.top/login" },
      { label: "Домен зарегистрирован", value: "11.10.2026" },
      { label: "Заголовок страницы", value: "MBANK — получите бонус 5000 сом" },
    ],
  },
  voting: {
    ...base,
    kind: "message",
    lang: "ru",
    verdict: "danger",
    title: "Кража аккаунта через «голосование»",
    summary: "Это известная схема: ссылка ведёт на поддельный вход в Telegram. Если ввести номер и код, аккаунт заберут и начнут писать твоим друзьям.",
    subject: "Сообщение",
    scheme: "voting",
    signals: [
      { level: "bad", text: "Просят проголосовать по ссылке — так начинается схема кражи аккаунтов." },
      { level: "bad", text: "Ссылка golos-konkurs.online: опасная." },
      { level: "warn", text: "Давление на жалость и срочность («очень нужно»)." },
    ],
    advice: [
      "Не открывай ссылку и не вводи номер телефона и код.",
      "Предупреди знакомого: похоже, его аккаунт уже взломан.",
      "Включи облачный пароль в Telegram: Настройки → Конфиденциальность → Облачный пароль.",
    ],
    facts: [],
    links: [
      {
        ...base,
        kind: "link",
        lang: "ru",
        verdict: "danger",
        title: "Похоже на мошенников",
        summary: "Страница-«голосование» просит номер телефона и код из Telegram.",
        subject: "golos-konkurs.online",
        scheme: "voting",
        signals: [
          { level: "bad", text: "Страница просит номер телефона и код — так крадут аккаунты Telegram и WhatsApp." },
          { level: "bad", text: "Сайт создан всего 5 дн. назад. Мошеннические сайты почти всегда новые." },
          { level: "warn", text: "Доменная зона .online дешёвая и часто используется для фишинга." },
        ],
        advice: [],
        facts: [{ label: "Адрес", value: "golos-konkurs.online/vote" }],
      },
    ],
  },
  real: {
    ...base,
    kind: "link",
    lang: "ru",
    verdict: "safe",
    title: "Официальный сайт Optima Bank",
    summary: "Это настоящий сайт банка. Всё равно никому не сообщай коды из SMS — банк их никогда не спрашивает.",
    subject: "optimabank.kg",
    scheme: null,
    signals: [{ level: "good", text: "Это официальный сайт Optima Bank." }],
    advice: ["Всё равно никому не сообщай коды из SMS — их не просят ни банки, ни поддержка."],
    facts: [{ label: "Адрес", value: "optimabank.kg" }],
  },
};

const KY: Record<DemoId, CheckResult> = {
  bank: {
    ...RU.bank,
    lang: "ky",
    title: "MBANKтын жасалма сайты",
    summary: "Сайт картаңдын маалыматын жана SMS кодун алуу үчүн өзүн MBANK деп көрсөтөт. Бул маалымат менен алдамчылар акчаңды чыгарып алышат.",
    signals: [
      { level: "bad", text: "Дарек MBANK сайтын тууроо кылат, бирок бул расмий сайт эмес. Чыныгы дареги — mbank.kg." },
      { level: "bad", text: "Сайт болгону 3 күн мурун түзүлгөн. Алдамчылардын сайттары дээрлик дайыма жаңы болот." },
      { level: "bad", text: "Барак өзүн MBANK деп көрсөтүп, картанын номерин, мөөнөтүн жана SMS кодун сурайт." },
      { level: "warn", text: ".top домендик зонасы арзан жана фишинг үчүн көп колдонулат." },
    ],
    advice: [
      "Бул сайтка эч кандай маалымат киргизбе.",
      "MBANKка расмий тиркеме аркылуу гана кир.",
      "Эгер картанын маалыматын киргизип койсоң — дароо банкка чалып, картаны бөгөттө.",
    ],
    facts: [
      { label: "Дарек", value: "mbank-bonus.top/login" },
      { label: "Домен катталган", value: "11.10.2026" },
      { label: "Барактын аталышы", value: "MBANK — получите бонус 5000 сом" },
    ],
  },
  voting: {
    ...RU.voting,
    lang: "ky",
    title: "«Добуш берүү» аркылуу аккаунт уурдоо",
    summary: "Бул белгилүү схема: шилтеме Telegramга жасалма кирүүгө алып барат. Номерди жана кодду киргизсең, аккаунтту алып, досторуңа жаза башташат.",
    subject: "Билдирүү",
    signals: [
      { level: "bad", text: "Шилтеме аркылуу добуш берүүнү сурашат — аккаунт уурдоо схемасы ушундан башталат." },
      { level: "bad", text: "golos-konkurs.online шилтемеси: коркунучтуу." },
      { level: "warn", text: "Боор ооруу жана шаштыруу аркылуу кысым («абдан керек»)." },
    ],
    advice: [
      "Шилтемени ачпа, телефон номерин жана кодду киргизбе.",
      "Таанышыңды эскерт: анын аккаунту бузулган окшойт.",
      "Telegramда булут сырсөзүн күйгүз: Жөндөөлөр → Купуялык → Булут сырсөзү.",
    ],
    links: [
      {
        ...RU.voting.links[0],
        lang: "ky",
        title: "Алдамчыларга окшойт",
        summary: "«Добуш берүү» барагы телефон номерин жана Telegram кодун сурайт.",
        signals: [
          { level: "bad", text: "Барак телефон номерин жана кодду сурайт — Telegram жана WhatsApp аккаунттарын ушундай уурдашат." },
          { level: "bad", text: "Сайт болгону 5 күн мурун түзүлгөн. Алдамчылардын сайттары дээрлик дайыма жаңы болот." },
          { level: "warn", text: ".online домендик зонасы арзан жана фишинг үчүн көп колдонулат." },
        ],
        facts: [{ label: "Дарек", value: "golos-konkurs.online/vote" }],
      },
    ],
  },
  real: {
    ...RU.real,
    lang: "ky",
    title: "Optima Bankтын расмий сайты",
    summary: "Бул банктын чыныгы сайты. Баары бир SMS коддорун эч кимге айтпа — банк аларды эч качан сурабайт.",
    signals: [{ level: "good", text: "Бул Optima Bank расмий сайты." }],
    advice: ["Баары бир SMS коддорун эч кимге айтпа — аларды банк да, колдоо кызматы да сурабайт."],
    facts: [{ label: "Дарек", value: "optimabank.kg" }],
  },
};

export function getDemoResult(id: DemoId, lang: Lang): CheckResult {
  return (lang === "ky" ? KY : RU)[id];
}
