import type { Lang } from "@/lib/types";

/* Long-form content for the "About" page. */

export interface TeamMember {
  name: string;
  role: string;
  links?: { label: string; href: string }[];
}

const AUTHOR_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/aba-bekrahoon-umurjanov-183b39352" },
  { label: "GitHub", href: "https://github.com/bekrahoon" },
];

export const TEAM: Record<Lang, TeamMember[]> = {
  ru: [{ name: "Аба-Бекрахун Умуржанов", role: "Идея, дизайн и разработка", links: AUTHOR_LINKS }],
  ky: [{ name: "Аба-Бекрахун Умуржанов", role: "Идея, дизайн жана иштеп чыгуу", links: AUTHOR_LINKS }],
  en: [{ name: "Aba-Bekrakhun Umurzhanov", role: "Idea, design and development", links: AUTHOR_LINKS }],
};

export const ABOUT_PAGE = {
  ru: {
    kicker: "Кто мы",
    title: "О проекте",
    lead: "Калкан (с кыргызского — «щит») проверяет ссылки, сообщения, документы и приложения и за несколько секунд говорит, похоже ли это на мошенников. На русском, кыргызском и английском.",
    missionTitle: "Зачем",
    mission:
      "По данным Генпрокуратуры, за январь–апрель 2026 года мошенничество в Кыргызстане выросло почти в 1,8 раза — до 5 267 случаев. Обманывают через поддельные сайты банков, «голосования» и сообщения от имени родственников. Человеку некогда разбираться: решение принимается за секунду. Калкан даёт ответ в эту секунду.",
    whyTitle: "Связь с правами человека",
    why: [
      ["Защита собственности", "Мошенники забирают сбережения людей. Калкан помогает остановиться до того, как деньги ушли."],
      ["Защита личных данных", "Украденный аккаунт — это переписка, фото и доверие близких. Мы предупреждаем о кражах аккаунтов."],
      ["ИИ на стороне человека", "Мошенники уже используют ИИ: идеальные тексты, поддельные голоса. Калкан использует ИИ, чтобы защищать."],
    ] as [string, string][],
    howTitle: "Как это работает",
    how: [
      "Ссылку сервер открывает как телефон: проходит все переадресации и смотрит, что просит страница — карту, пароль, код.",
      "Проверяет адрес: возраст домена, подделку под банки и известные сервисы, базы фишинговых сайтов, жалобы пользователей.",
      "Gemini Flash читает сообщение или страницу, узнаёт известные схемы и объясняет вердикт простыми словами.",
      "Если ИИ недоступен, вердикт по ссылкам всё равно есть — по техническим проверкам.",
    ],
    limitsTitle: "Честно об ограничениях",
    limits: [
      "Калкан проверяет по признакам и может ошибаться. «Признаков обмана нет» — не гарантия.",
      "Подлинность документа по фото мы не определяем: это невозможно сделать надёжно.",
      "Мы храним только жалобы на сайты и приложения — без данных о том, кто пожаловался. Жалобы на номера телефонов не принимаем: ложная метка могла бы навредить честному человеку.",
    ],
    teamTitle: "Автор",
    cta: "Проверить что-нибудь",
  },
  ky: {
    kicker: "Биз кимбиз",
    title: "Долбоор жөнүндө",
    lead: "Калкан шилтемелерди, билдирүүлөрдү, документтерди жана тиркемелерди текшерип, бир нече секундда алдамчыларга окшошпу же жокпу айтат. Орусча, кыргызча жана англисче.",
    missionTitle: "Эмне үчүн",
    mission:
      "Башкы прокуратуранын маалыматы боюнча, 2026-жылдын январь–апрель айларында Кыргызстанда алдамчылык дээрлик 1,8 эсе өсүп, 5 267 учурга жетти. Банктардын жасалма сайттары, «добуш берүү» жана туугандардын атынан билдирүүлөр аркылуу алдашат. Адамдын түшүнүүгө убактысы жок: чечим бир секундда кабыл алынат. Калкан ошол секундда жооп берет.",
    whyTitle: "Адам укуктары менен байланышы",
    why: [
      ["Менчикти коргоо", "Алдамчылар адамдардын жыйнагын алышат. Калкан акча кете электе токтоого жардам берет."],
      ["Жеке маалыматты коргоо", "Уурдалган аккаунт — бул кат алышуу, сүрөттөр жана жакындардын ишеними. Биз аккаунт уурдоо тууралуу эскертебиз."],
      ["ЖИ адамдын тарабында", "Алдамчылар ЖИни колдонуп жатышат: мыкты тексттер, жасалма үндөр. Калкан ЖИни коргоо үчүн колдонот."],
    ],
    howTitle: "Бул кантип иштейт",
    how: [
      "Шилтемени сервер телефондой ачат: бардык которууларды өтүп, барак эмне сурап жатканын карайт — карта, сырсөз, код.",
      "Даректи текшерет: доменин жашы, банктарды жана белгилүү сервистерди тууроо, фишинг сайттарынын базалары, колдонуучулардын даттануулары.",
      "Gemini Flash билдирүүнү же баракты окуп, белгилүү схемаларды таанып, корутундуну жөнөкөй сөз менен түшүндүрөт.",
      "ЖИ жеткиликсиз болсо да, шилтемелер боюнча корутунду техникалык текшерүүлөр боюнча чыгат.",
    ],
    limitsTitle: "Чектөөлөр тууралуу ачык айтабыз",
    limits: [
      "Калкан белгилер боюнча текшерет жана жаңылышы мүмкүн. «Алдоонун белгилери жок» — кепилдик эмес.",
      "Документтин чыныгы экенин сүрөт боюнча аныктабайбыз: муну ишенимдүү жасоо мүмкүн эмес.",
      "Сайттарга жана тиркемелерге даттанууларды гана сактайбыз — ким даттанганы тууралуу маалыматсыз. Телефон номерлерине даттанууларды кабыл албайбыз: жалган белги чынчыл адамга зыян келтириши мүмкүн.",
    ],
    teamTitle: "Автор",
    cta: "Бир нерсе текшерүү",
  },
  en: {
    kicker: "Who we are",
    title: "About the project",
    lead: "Kalkan (Kyrgyz for “shield”) checks links, messages, documents and apps and in a few seconds tells you whether it looks like a scam. In Russian, Kyrgyz and English.",
    missionTitle: "Why",
    mission:
      "According to the Prosecutor General’s Office, in January–April 2026 fraud in Kyrgyzstan grew almost 1.8 times — to 5,267 cases. People are tricked with fake bank websites, “votes” and messages in the name of relatives. Nobody has time to investigate: the decision is made in a second. Kalkan gives an answer in that second.",
    whyTitle: "Link to human rights",
    why: [
      ["Protecting property", "Scammers take people’s savings. Kalkan helps you stop before the money is gone."],
      ["Protecting personal data", "A stolen account means chats, photos and the trust of loved ones. We warn about account theft."],
      ["AI on people’s side", "Scammers already use AI: perfect texts, fake voices. Kalkan uses AI to protect."],
    ],
    howTitle: "How it works",
    how: [
      "The server opens a link like a phone would: follows all redirects and sees what the page asks for — card, password, code.",
      "It checks the address: domain age, look-alikes of banks and well-known services, phishing databases, user reports.",
      "Gemini Flash reads the message or page, recognises known scams and explains the verdict in plain words.",
      "If the AI is unavailable, links still get a verdict from the technical checks.",
    ],
    limitsTitle: "Honest about the limits",
    limits: [
      "Kalkan checks for warning signs and can be wrong. “No signs of a scam” is not a guarantee.",
      "We don’t judge whether a document is genuine from a photo: it can’t be done reliably.",
      "We store only reports about sites and apps — with no data about who reported. We don’t accept reports on phone numbers: a false label could harm an honest person.",
    ],
    teamTitle: "Author",
    cta: "Check something",
  },
} satisfies Record<Lang, unknown>;
