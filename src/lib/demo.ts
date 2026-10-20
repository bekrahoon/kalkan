import type { CheckResult, DemoId, Lang } from "./types";

/*
 * Prepared examples for the demo buttons: they work instantly, offline and without the AI.
 * The domains are made up for the demo.
 */

export const DEMO_IDS: DemoId[] = ["bank", "voting", "fine", "company", "real"];

export const DEMO_INPUTS: Record<DemoId, string> = {
  bank: "https://mbank-bonus.top/login",
  voting: "Привет! Проголосуй, пожалуйста, за мою племянницу в конкурсе, очень нужно 🙏 https://golos-konkurs.online/vote",
  fine: "📄 Пример: «Постановление о штрафе» с оплатой на карту инспектора",
  company:
    "Golden Profit KG — инвестиционная компания. Гарантированный доход 30% в месяц, за каждого приглашённого друга бонус 10%. Взнос от 5000 сом на карту менеджера, пишите в Telegram.",
  real: "https://optimabank.kg",
};

export const isDemoId = (v: unknown): v is DemoId => typeof v === "string" && (DEMO_IDS as string[]).includes(v);

const base = { indicators: [] as CheckResult["indicators"], reports: 0, links: [] as CheckResult[], demo: true };

const RU = {
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

const RU_FINE: CheckResult = {
  ...base,
  kind: "document",
  lang: "ru",
  verdict: "danger",
  title: "Поддельное постановление о штрафе",
  summary: "Настоящие штрафы не оплачивают переводом на карту инспектора и не решают через WhatsApp. Это схема от имени госорганов.",
  subject: "Постановление о штрафе",
  scheme: "fake_gov",
  signals: [
    { level: "bad", text: "Оплату просят перевести на личную карту «инспектора»." },
    { level: "bad", text: "Угрожают уголовным делом и тройным штрафом, если не заплатить за 24 часа." },
    { level: "warn", text: "Связь только через WhatsApp с мобильного номера, а не через официальный телефон." },
    { level: "warn", text: "QR-код ведёт не на официальный госсайт, а на shtraf-mvd-kg.online." },
  ],
  advice: ["Ничего не переводи по этому документу.", "Не звони и не пиши на номер из документа.", "Предупреди близких: такие «штрафы» рассылают многим."],
  facts: [
    { label: "Тип документа", value: "Постановление о штрафе" },
    { label: "От кого", value: "«Министерство внутренних дел»" },
    { label: "QR-код", value: "https://shtraf-mvd-kg.online/check?id=4471" },
  ],
  verify: "Проверь штрафы на официальном портале госуслуг или позвони в милицию по номеру с официального сайта МВД. Настоящий штраф оплачивается через банк или терминал по реквизитам госоргана.",
};

const RU_COMPANY: CheckResult = {
  ...base,
  kind: "company",
  lang: "ru",
  verdict: "danger",
  title: "Признаки финансовой пирамиды",
  summary: "Компания обещает огромный гарантированный доход и платит за приглашённых. Так работают пирамиды: первым платят из денег новых участников, потом всё исчезает.",
  subject: "Golden Profit KG",
  scheme: "investment",
  signals: [
    { level: "bad", text: "Обещают гарантированный доход. Настоящие инвестиции и вклады никогда не гарантируют прибыль сверх ставки банка." },
    { level: "bad", text: "Обещают очень высокий процент за день, неделю или месяц. Так платят только финансовые пирамиды — из денег новых участников." },
    { level: "bad", text: "Платят за приглашённых людей. Это главный признак финансовой пирамиды." },
    { level: "bad", text: "Деньги просят перевести на личную карту или кошелёк, а не на счёт компании." },
    { level: "warn", text: "30% в месяц — это больше 350% в год. Ни один банк и ни одна законная компания столько не обещают." },
  ],
  advice: [
    "Не переводи деньги и не вноси «первый взнос».",
    "Не приглашай друзей и родных — их деньги пропадут вместе с твоими.",
    "Если уже заплатил — сохрани чеки и переписку и напиши заявление в милицию (102).",
  ],
  facts: [],
  verify:
    "Найди компанию в реестре юрлиц Министерства юстиции (record.minjust.gov.kg). Если она принимает вклады, выдаёт займы или меняет валюту — у неё должна быть лицензия Нацбанка (nbkr.kg). Инвестиции, ценные бумаги и криптовалюта — под надзором Госфиннадзора (fsa.gov.kg). Нет в реестре или нет лицензии — не отдавай деньги.",
};

const KY = {
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

const KY_FINE: CheckResult = {
  ...RU_FINE,
  lang: "ky",
  title: "Айып боюнча жасалма токтом",
  summary: "Чыныгы айыптар инспектордун картасына которуу менен төлөнбөйт жана WhatsApp аркылуу чечилбейт. Бул мамлекеттик органдардын атынан схема.",
  subject: "Айып боюнча токтом",
  signals: [
    { level: "bad", text: "Төлөмдү «инспектордун» жеке картасына которууну сурашат." },
    { level: "bad", text: "24 саатта төлөбөсөң, кылмыш иши жана үч эсе айып менен коркутушат." },
    { level: "warn", text: "Расмий телефон аркылуу эмес, мобилдик номерден WhatsApp аркылуу гана байланыш." },
    { level: "warn", text: "QR-код расмий мамлекеттик сайтка эмес, shtraf-mvd-kg.online дарегине алып барат." },
  ],
  advice: ["Бул документ боюнча эч нерсе которбо.", "Документтеги номерге чалба жана жазба.", "Жакындарыңды эскерт: мындай «айыптарды» көп адамга жөнөтүшөт."],
  facts: [
    { label: "Документтин түрү", value: "Айып боюнча токтом" },
    { label: "Кимден", value: "«Ички иштер министрлиги»" },
    { label: "QR-код", value: "https://shtraf-mvd-kg.online/check?id=4471" },
  ],
  verify: "Айыптарды мамлекеттик кызматтардын расмий порталынан текшер же ИИМдин расмий сайтындагы номерге чал. Чыныгы айып банк же терминал аркылуу мамлекеттик органдын реквизиттери боюнча төлөнөт.",
};

const KY_COMPANY: CheckResult = {
  ...RU_COMPANY,
  lang: "ky",
  title: "Каржылык пирамиданын белгилери",
  summary: "Компания чоң кепилденген киреше убада кылып, чакырылгандар үчүн төлөйт. Пирамидалар ушундай иштейт: алгачкыларга жаңы катышуучулардын акчасынан төлөшөт, андан кийин баары жоголот.",
  signals: [
    { level: "bad", text: "Кепилденген киреше убада кылышат. Чыныгы инвестициялар жана салымдар банктын пайызынан ашык пайданы эч качан кепилдебейт." },
    { level: "bad", text: "Күнүнө, жумасына же айына өтө жогору пайыз убада кылышат. Мындайды каржылык пирамидалар гана төлөйт — жаңы катышуучулардын акчасынан." },
    { level: "bad", text: "Чакырылган адамдар үчүн төлөшөт. Бул каржылык пирамиданын негизги белгиси." },
    { level: "bad", text: "Акчаны компаниянын эсебине эмес, жеке картага же капчыкка которууну суранышат." },
    { level: "warn", text: "Айына 30% — бул жылына 350%дан ашык. Бир дагы банк жана мыйзамдуу компания мынчаны убада кылбайт." },
  ],
  advice: [
    "Акча которбо жана «биринчи салымды» төлөбө.",
    "Досторуңду жана туугандарыңды чакырба — алардын акчасы сеникиндей эле жоголот.",
    "Эгер төлөп койсоң — чектерди жана кат алышууну сактап, милицияга арыз жаз (102).",
  ],
  verify:
    "Компанияны Юстиция министрлигинин юридикалык жактар реестринен тап (record.minjust.gov.kg). Эгер ал салым кабыл алса, насыя берсе же валюта алмаштырса — Улуттук банктын лицензиясы болушу керек (nbkr.kg). Инвестициялар, баалуу кагаздар жана криптовалюта — Мамфинкөзөмөлдүн көзөмөлүндө (fsa.gov.kg). Реестрде жок же лицензиясы жок болсо — акча бербе.",
};

const EN = {
  bank: {
    ...RU.bank,
    lang: "en",
    title: "Fake MBANK website",
    summary: "The site pretends to be MBANK to get your card details and SMS code. With them, scammers will take your money.",
    signals: [
      { level: "bad", text: "The address imitates MBANK, but this is not the official site. The real address is mbank.kg." },
      { level: "bad", text: "The site was created only 3 days ago. Scam sites are almost always new." },
      { level: "bad", text: "The page pretends to be MBANK and asks for the card number, expiry date and SMS code." },
      { level: "warn", text: "The .top domain zone is cheap and often used for phishing." },
    ],
    advice: [
      "Don’t enter any data on this site.",
      "Use MBANK only through the official app.",
      "If you already entered your card details — call the bank right away and block the card.",
    ],
    facts: [
      { label: "Address", value: "mbank-bonus.top/login" },
      { label: "Domain registered", value: "11.10.2026" },
      { label: "Page title", value: "MBANK — получите бонус 5000 сом" },
    ],
  },
  voting: {
    ...RU.voting,
    lang: "en",
    title: "Account theft via a “vote”",
    summary: "This is a known scheme: the link leads to a fake Telegram login. If you enter your number and code, they take the account and start messaging your friends.",
    subject: "Message",
    signals: [
      { level: "bad", text: "They ask you to vote via a link — this is how the account-theft scheme starts." },
      { level: "bad", text: "Link golos-konkurs.online: dangerous." },
      { level: "warn", text: "Pressure through pity and urgency (“I really need it”)." },
    ],
    advice: [
      "Don’t open the link and don’t enter your phone number or code.",
      "Warn your friend: their account seems to be hacked already.",
      "Turn on a cloud password in Telegram: Settings → Privacy → Cloud password.",
    ],
    links: [
      {
        ...RU.voting.links[0],
        lang: "en",
        title: "Looks like a scam",
        summary: "A “voting” page asks for a phone number and a Telegram code.",
        signals: [
          { level: "bad", text: "The page asks for a phone number and a code — this is how Telegram and WhatsApp accounts are stolen." },
          { level: "bad", text: "The site was created only 5 days ago. Scam sites are almost always new." },
          { level: "warn", text: "The .online domain zone is cheap and often used for phishing." },
        ],
        facts: [{ label: "Address", value: "golos-konkurs.online/vote" }],
      },
    ],
  },
  real: {
    ...RU.real,
    lang: "en",
    title: "Official Optima Bank website",
    summary: "This is the bank’s real website. Still, never share SMS codes — the bank never asks for them.",
    signals: [{ level: "good", text: "This is the official website of Optima Bank." }],
    advice: ["Still never share SMS codes — banks and support never ask for them."],
    facts: [{ label: "Address", value: "optimabank.kg" }],
  },
};

const EN_FINE: CheckResult = {
  ...RU_FINE,
  lang: "en",
  title: "Fake fine notice",
  summary: "Real fines are not paid by transfer to an inspector’s card and are not settled via WhatsApp. This is a scheme in the name of the authorities.",
  subject: "Fine notice",
  signals: [
    { level: "bad", text: "Payment is requested to the “inspector’s” personal card." },
    { level: "bad", text: "They threaten a criminal case and a triple fine if you don’t pay within 24 hours." },
    { level: "warn", text: "Contact only via WhatsApp from a mobile number, not an official phone." },
    { level: "warn", text: "The QR code leads not to an official government site but to shtraf-mvd-kg.online." },
  ],
  advice: ["Don’t pay anything based on this document.", "Don’t call or message the number in the document.", "Warn your family: such “fines” are sent to many people."],
  facts: [
    { label: "Document type", value: "Fine notice" },
    { label: "From", value: "“Ministry of Internal Affairs”" },
    { label: "QR code", value: "https://shtraf-mvd-kg.online/check?id=4471" },
  ],
  verify: "Check your fines on the official public-services portal or call the police on the number from the official Ministry of Internal Affairs website. A real fine is paid through a bank or terminal using the government body’s details.",
};

const EN_COMPANY: CheckResult = {
  ...RU_COMPANY,
  lang: "en",
  title: "Signs of a pyramid scheme",
  summary: "The company promises huge guaranteed income and pays for bringing in people. That is how pyramids work: early members are paid with new members’ money, then everything disappears.",
  signals: [
    { level: "bad", text: "They promise guaranteed income. Real investments and deposits never guarantee profit above the bank rate." },
    { level: "bad", text: "They promise a very high return per day, week or month. Only pyramid schemes pay like that — with new members’ money." },
    { level: "bad", text: "They pay for bringing in people. This is the main sign of a pyramid scheme." },
    { level: "bad", text: "They ask you to send money to a personal card or wallet, not to a company account." },
    { level: "warn", text: "30% a month is more than 350% a year. No bank or legal company promises that much." },
  ],
  advice: [
    "Don’t send money or make a “first deposit”.",
    "Don’t invite friends and family — their money will disappear along with yours.",
    "If you already paid — keep receipts and chats and file a police report (102).",
  ],
  verify:
    "Find the company in the Ministry of Justice register of legal entities (record.minjust.gov.kg). If it takes deposits, gives loans or exchanges currency, it must have a National Bank licence (nbkr.kg). Investments, securities and crypto are supervised by the State Financial Supervision Service (fsa.gov.kg). Not in the register or no licence — don’t give them money.",
};

const ALL: Record<Lang, Record<DemoId, CheckResult>> = {
  ru: { ...(RU as Record<Exclude<DemoId, "fine" | "company">, CheckResult>), fine: RU_FINE, company: RU_COMPANY },
  ky: { ...(KY as Record<Exclude<DemoId, "fine" | "company">, CheckResult>), fine: KY_FINE, company: KY_COMPANY },
  en: { ...(EN as Record<Exclude<DemoId, "fine" | "company">, CheckResult>), fine: EN_FINE, company: EN_COMPANY },
};

export function getDemoResult(id: DemoId, lang: Lang): CheckResult {
  return ALL[lang][id];
}
