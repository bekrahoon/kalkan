import type { Lang } from "@/lib/types";

/*
 * Privacy policy, terms of use and the first-visit consent window.
 * Written to match what the code actually does (see src/lib/check, src/lib/reports.ts).
 * Before a public launch the team should have a lawyer review it.
 * Bump CONSENT_VERSION whenever the texts change materially: everyone will be asked again.
 */
export const CONSENT_VERSION = "2026-10-15";
export const LEGAL_UPDATED = "15.10.2026";
export const CONTACT_URL = "https://github.com/bekrahoon";
export const CONTACT_LABEL = "github.com/bekrahoon";

export interface LegalDoc {
  title: string;
  intro: string;
  sections: { h: string; p: string[] }[];
}

export const PRIVACY: Record<Lang, LegalDoc> = {
  ru: {
    title: "Политика конфиденциальности",
    intro:
      "KalkanCheck — некоммерческий проект, который помогает проверить ссылки, сообщения, документы и приложения на признаки мошенничества. Здесь написано, какие данные мы получаем, зачем и кому они передаются.",
    sections: [
      {
        h: "1. Что мы получаем",
        p: [
          "То, что ты сам отправляешь на проверку: текст, ссылку, картинку или PDF-файл.",
          "Технические данные запроса: IP-адрес и время. Они нужны, чтобы ограничить число проверок и защитить сервис от злоупотреблений.",
          "Если ты нажимаешь «Пожаловаться» — адрес сайта или идентификатор приложения, на которые ты жалуешься. Жалобы на номера телефонов мы не принимаем и не храним: ложная жалоба могла бы навредить честному человеку.",
          "В Telegram-боте — номер чата и язык, чтобы отвечать тебе и ограничивать число проверок.",
          "Мы не просим имя, e-mail или пароль и не создаём аккаунты.",
        ],
      },
      {
        h: "2. Зачем",
        p: [
          "Только чтобы проверить то, что ты прислал, показать результат и предупредить других людей о мошенниках через жалобы.",
          "Мы не используем твои данные для рекламы и не продаём их.",
        ],
      },
      {
        h: "3. Кому передаются данные",
        p: [
          "Google (Gemini API) — текст, картинка или файл передаются модели ИИ для анализа. Google обрабатывает их по своим условиям использования Gemini API.",
          "Vercel — хостинг сайта и хранилище жалоб.",
          "Сайт, который ты проверяешь, — наш сервер открывает ссылку, как обычный браузер. Сайт видит запрос от нашего сервера, но не твой IP-адрес.",
          "Реестры доменов (RDAP/WHOIS), базы фишинговых сайтов и Google Play — им передаётся только адрес сайта или идентификатор приложения.",
          "Telegram — если ты пользуешься ботом.",
        ],
      },
      {
        h: "4. Что и сколько мы храним",
        p: [
          "Тексты, картинки и файлы, которые ты проверяешь, мы не сохраняем: после ответа они удаляются. Результат проверки ссылки может временно храниться в памяти сервера до 30 минут, чтобы быстрее отвечать на повторные проверки.",
          "Жалобы хранятся постоянно: адрес сайта или идентификатор приложения, число жалоб и даты. Кто именно пожаловался, мы не храним.",
          "История проверок на сайте хранится только в твоём браузере. Её можно удалить кнопкой «Очистить».",
          "Технические журналы сервера хранятся у хостинга ограниченное время.",
        ],
      },
      {
        h: "5. Будь осторожен с личными данными",
        p: [
          "Перед загрузкой документа закрой номера паспорта, ИНН, банковских карт и другие данные, которые не нужны для проверки. KalkanCheck они не нужны, чтобы найти признаки обмана.",
        ],
      },
      {
        h: "6. Твои права",
        p: [
          "Ты можешь не пользоваться KalkanCheck, удалить историю в браузере и попросить удалить жалобу, если считаешь её ошибочной. Обработка данных ведётся с учётом Закона Кыргызской Республики «Об информации персонального характера».",
          `Связаться с командой: ${CONTACT_LABEL}.`,
        ],
      },
      {
        h: "7. Дети",
        p: ["Если тебе меньше 16 лет, пользуйся KalkanCheck вместе с родителями."],
      },
      {
        h: "8. Изменения",
        p: ["Если политика изменится, мы покажем окно согласия ещё раз. Дата последнего изменения указана вверху страницы."],
      },
    ],
  },
  ky: {
    title: "Купуялык саясаты",
    intro:
      "KalkanCheck — шилтемелерди, билдирүүлөрдү, документтерди жана тиркемелерди алдамчылыктын белгилерине текшерүүгө жардам берген коммерциялык эмес долбоор. Бул жерде кандай маалымат алабыз, эмне үчүн жана кимге берилет — жазылган.",
    sections: [
      {
        h: "1. Эмнени алабыз",
        p: [
          "Текшерүүгө өзүң жөнөткөн нерсени: текст, шилтеме, сүрөт же PDF-файл.",
          "Суроо-талаптын техникалык маалыматтары: IP-дарек жана убакыт. Алар текшерүүлөрдүн санын чектөө жана сервисти кыянаттыктан коргоо үчүн керек.",
          "«Даттануу» басканда — даттанган сайттын дареги же тиркеменин идентификатору. Телефон номерлерине даттанууларды кабыл албайбыз жана сактабайбыз: жалган даттануу чынчыл адамга зыян келтириши мүмкүн.",
          "Telegram-ботто — чаттын номери жана тил, сага жооп берүү жана текшерүүлөрдү чектөө үчүн.",
          "Атыңды, e-mail же сырсөздү сурабайбыз жана аккаунт түзбөйбүз.",
        ],
      },
      {
        h: "2. Эмне үчүн",
        p: [
          "Жөнөткөн нерсеңди текшерип, жыйынтыкты көрсөтүү жана даттануулар аркылуу башкаларды алдамчылардан эскертүү үчүн гана.",
          "Маалыматыңды жарнама үчүн колдонбойбуз жана сатпайбыз.",
        ],
      },
      {
        h: "3. Маалымат кимге берилет",
        p: [
          "Google (Gemini API) — текст, сүрөт же файл талдоо үчүн ЖИ моделине берилет. Google аларды Gemini APIнин колдонуу шарттарына ылайык иштетет.",
          "Vercel — сайттын хостинги жана даттануулардын сактагычы.",
          "Сен текшерген сайт — биздин сервер шилтемени кадимки браузердей ачат. Сайт биздин сервердин суроо-талабын көрөт, сенин IP-дарегиңди көрбөйт.",
          "Домендердин реестрлери (RDAP/WHOIS), фишинг сайттарынын базалары жана Google Play — аларга сайттын дареги же тиркеменин идентификатору гана берилет.",
          "Telegram — ботту колдонсоң.",
        ],
      },
      {
        h: "4. Эмнени жана канча убакыт сактайбыз",
        p: [
          "Текшерген тексттериңди, сүрөттөрүңдү жана файлдарыңды сактабайбыз: жооп бергенден кийин алар өчүрүлөт. Шилтемени текшерүүнүн жыйынтыгы кайталанган текшерүүлөргө тезирээк жооп берүү үчүн сервердин эсинде 30 мүнөткө чейин убактылуу сакталышы мүмкүн.",
          "Даттануулар туруктуу сакталат: сайттын дареги же тиркеменин идентификатору, даттануулардын саны жана даталар. Ким даттанганын сактабайбыз.",
          "Сайттагы текшерүүлөрдүн тарыхы сенин браузериңде гана сакталат. Аны «Тазалоо» баскычы менен өчүрсө болот.",
          "Сервердин техникалык журналдары хостингде чектелген убакыт сакталат.",
        ],
      },
      {
        h: "5. Жеке маалымат менен этият бол",
        p: [
          "Документти жүктөөдөн мурун паспорттун, ИННдин, банк карталарынын номерлерин жана текшерүүгө керек эмес башка маалыматтарды жап. Алдоонун белгилерин табуу үчүн KalkanCheckке алар керек эмес.",
        ],
      },
      {
        h: "6. Сенин укуктарың",
        p: [
          "KalkanCheckти колдонбой коюуга, браузердеги тарыхты өчүрүүгө жана ката деп эсептеген даттанууну өчүрүүнү суранууга укуктуусуң. Маалымат Кыргыз Республикасынын «Жеке мүнөздөгү маалымат жөнүндө» Мыйзамын эске алуу менен иштетилет.",
          `Команда менен байланыш: ${CONTACT_LABEL}.`,
        ],
      },
      {
        h: "7. Балдар",
        p: ["Эгер 16 жашка чыга элек болсоң, KalkanCheckти ата-энең менен бирге колдон."],
      },
      {
        h: "8. Өзгөртүүлөр",
        p: ["Саясат өзгөрсө, макулдук терезесин кайра көрсөтөбүз. Акыркы өзгөртүүнүн датасы барактын башында көрсөтүлгөн."],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    intro:
      "KalkanCheck is a non-commercial project that helps check links, messages, documents and apps for signs of fraud. This page explains what data we receive, why, and who it is shared with.",
    sections: [
      {
        h: "1. What we receive",
        p: [
          "What you submit for a check yourself: text, a link, an image or a PDF file.",
          "Technical request data: IP address and time. We need them to limit the number of checks and protect the service from abuse.",
          "If you tap “Report” — the address of the site or the ID of the app you report. We do not accept or store reports on phone numbers: a false report could harm an honest person.",
          "In the Telegram bot — the chat ID and language, to reply to you and limit the number of checks.",
          "We don’t ask for your name, e-mail or password and don’t create accounts.",
        ],
      },
      {
        h: "2. Why",
        p: [
          "Only to check what you sent, show the result and warn other people about scammers through reports.",
          "We don’t use your data for advertising and don’t sell it.",
        ],
      },
      {
        h: "3. Who the data is shared with",
        p: [
          "Google (Gemini API) — the text, image or file is sent to the AI model for analysis. Google processes it under its Gemini API terms of use.",
          "Vercel — website hosting and report storage.",
          "The site you check — our server opens the link like a normal browser. The site sees a request from our server, not your IP address.",
          "Domain registries (RDAP/WHOIS), phishing databases and Google Play — they receive only the site address or app ID.",
          "Telegram — if you use the bot.",
        ],
      },
      {
        h: "4. What we store and for how long",
        p: [
          "We don’t save the texts, images and files you check: they are deleted after the answer. A link check result may be kept in server memory for up to 30 minutes to answer repeat checks faster.",
          "Reports are stored permanently: the site address or app ID, the number of reports and dates. We don’t store who reported.",
          "Your check history on the website is stored only in your browser. You can delete it with the “Clear” button.",
          "Technical server logs are kept by the host for a limited time.",
        ],
      },
      {
        h: "5. Be careful with personal data",
        p: [
          "Before uploading a document, cover passport, tax ID, bank card numbers and other data not needed for the check. KalkanCheck doesn’t need them to find signs of fraud.",
        ],
      },
      {
        h: "6. Your rights",
        p: [
          "You may stop using KalkanCheck, delete the history in your browser and ask us to delete a report you think is wrong. Data is processed in line with the Law of the Kyrgyz Republic “On Personal Information”.",
          `Contact the team: ${CONTACT_LABEL}.`,
        ],
      },
      {
        h: "7. Children",
        p: ["If you are under 16, use KalkanCheck together with your parents."],
      },
      {
        h: "8. Changes",
        p: ["If the policy changes, we will show the consent window again. The date of the last change is shown at the top of the page."],
      },
    ],
  },
};

export const TERMS: Record<Lang, LegalDoc> = {
  ru: {
    title: "Пользовательское соглашение",
    intro: "Пользуясь KalkanCheck на сайте или в Telegram-боте, ты соглашаешься с этими условиями.",
    sections: [
      {
        h: "1. Что делает KalkanCheck",
        p: [
          "KalkanCheck ищет признаки мошенничества по техническим проверкам, базам фишинга, жалобам пользователей и с помощью ИИ, и объясняет результат простыми словами.",
          "KalkanCheck бесплатный и предоставляется «как есть».",
        ],
      },
      {
        h: "2. Это подсказка, а не гарантия",
        p: [
          "Проверка может ошибаться в обе стороны: пропустить мошенников или ошибочно предупредить о честном сайте. «Признаков обмана нет» не означает, что всё безопасно.",
          "KalkanCheck не подтверждает подлинность документов — это может сделать только организация, которая их выдала.",
          "KalkanCheck — не юридическая, финансовая или правоохранительная консультация. Важные решения принимай сам и проверяй информацию официально.",
          "Команда проекта не отвечает за убытки, связанные с использованием или неиспользованием результатов проверки.",
        ],
      },
      {
        h: "3. Правила использования",
        p: [
          "Не отправляй чужие личные данные без необходимости и закрывай номера документов и карт.",
          "Не жалуйся на сайты и приложения без причины. Жалобы проверяются, ложные удаляются.",
          "Не пытайся перегрузить сервис, обойти ограничения или использовать его для атак на другие сайты.",
        ],
      },
      {
        h: "4. Независимость",
        p: [
          "KalkanCheck не связан с банками, операторами связи и госорганами, которые упоминаются в результатах. Их названия используются только чтобы сравнивать адреса с настоящими.",
        ],
      },
      {
        h: "5. Изменения",
        p: [`Условия могут меняться — мы покажем окно согласия ещё раз. Вопросы: ${CONTACT_LABEL}.`],
      },
    ],
  },
  ky: {
    title: "Колдонуучу келишими",
    intro: "KalkanCheckти сайтта же Telegram-ботто колдонуу менен сен ушул шарттарга макул болосуң.",
    sections: [
      {
        h: "1. KalkanCheck эмне кылат",
        p: [
          "KalkanCheck техникалык текшерүүлөр, фишинг базалары, колдонуучулардын даттануулары жана ЖИнин жардамы менен алдамчылыктын белгилерин издейт жана жыйынтыкты жөнөкөй сөз менен түшүндүрөт.",
          "KalkanCheck акысыз жана «кандай болсо ошондой» берилет.",
        ],
      },
      {
        h: "2. Бул кеңеш, кепилдик эмес",
        p: [
          "Текшерүү эки жакка тең жаңылышы мүмкүн: алдамчыларды өткөрүп жибериши же чынчыл сайт тууралуу жаңылыш эскертиши мүмкүн. «Алдоонун белгилери жок» баары коопсуз дегенди билдирбейт.",
          "KalkanCheck документтердин чыныгы экенин тастыктабайт — муну аларды берген уюм гана кыла алат.",
          "KalkanCheck — юридикалык, каржылык же укук коргоо консультациясы эмес. Маанилүү чечимдерди өзүң кабыл ал жана маалыматты расмий түрдө текшер.",
          "Долбоордун командасы текшерүүнүн жыйынтыктарын колдонуу же колдонбоо менен байланышкан зыяндар үчүн жооп бербейт.",
        ],
      },
      {
        h: "3. Колдонуу эрежелери",
        p: [
          "Бөтөн адамдардын жеке маалыматын зарылчылыксыз жөнөтпө жана документтердин, карталардын номерлерин жап.",
          "Сайттарга жана тиркемелерге себепсиз даттанба. Даттануулар текшерилет, жалгандары өчүрүлөт.",
          "Сервисти ашыкча жүктөөгө, чектөөлөрдү айланып өтүүгө же башка сайттарга чабуул үчүн колдонууга аракет кылба.",
        ],
      },
      {
        h: "4. Көз карандысыздык",
        p: [
          "KalkanCheck жыйынтыктарда аталган банктар, байланыш операторлору жана мамлекеттик органдар менен байланышпайт. Алардын аттары даректерди чыныгылары менен салыштыруу үчүн гана колдонулат.",
        ],
      },
      {
        h: "5. Өзгөртүүлөр",
        p: [`Шарттар өзгөрүшү мүмкүн — макулдук терезесин кайра көрсөтөбүз. Суроолор: ${CONTACT_LABEL}.`],
      },
    ],
  },
  en: {
    title: "Terms of use",
    intro: "By using KalkanCheck on the website or in the Telegram bot, you agree to these terms.",
    sections: [
      {
        h: "1. What KalkanCheck does",
        p: [
          "KalkanCheck looks for signs of fraud using technical checks, phishing databases, user reports and AI, and explains the result in plain words.",
          "KalkanCheck is free and provided “as is”.",
        ],
      },
      {
        h: "2. It’s a hint, not a guarantee",
        p: [
          "A check can be wrong either way: miss scammers or wrongly warn about an honest site. “No signs of a scam” does not mean everything is safe.",
          "KalkanCheck does not confirm that documents are genuine — only the organisation that issued them can do that.",
          "KalkanCheck is not legal, financial or law-enforcement advice. Make important decisions yourself and verify information officially.",
          "The project team is not liable for losses related to using or not using the check results.",
        ],
      },
      {
        h: "3. Rules of use",
        p: [
          "Don’t send other people’s personal data unless necessary, and cover document and card numbers.",
          "Don’t report sites and apps without a reason. Reports are reviewed, false ones are deleted.",
          "Don’t try to overload the service, bypass limits or use it to attack other sites.",
        ],
      },
      {
        h: "4. Independence",
        p: [
          "KalkanCheck is not affiliated with the banks, mobile operators and government bodies mentioned in the results. Their names are used only to compare addresses with the real ones.",
        ],
      },
      {
        h: "5. Changes",
        p: [`The terms may change — we will show the consent window again. Questions: ${CONTACT_LABEL}.`],
      },
    ],
  },
};

export const CONSENT: Record<
  Lang,
  { title: string; lead: string; points: string[]; read: string; privacy: string; terms: string; accept: string; cancel: string; declinedTitle: string; declinedText: string; again: string; leave: string; updated: string }
> = {
  ru: {
    title: "Прежде чем начать",
    lead: "Коротко о том, как работает KalkanCheck:",
    points: [
      "То, что ты отправляешь на проверку, анализирует ИИ Google Gemini. Мы это не сохраняем.",
      "Сохраняются только жалобы на мошенников — без данных о тебе.",
      "Проверка — подсказка, а не гарантия. Подлинность документов мы не подтверждаем.",
      "Закрывай номера паспорта и карт на фото документов.",
    ],
    read: "Подробнее:",
    privacy: "Политика конфиденциальности",
    terms: "Пользовательское соглашение",
    accept: "Принимаю",
    cancel: "Отмена",
    declinedTitle: "Ты не принял условия",
    declinedText: "Без согласия с условиями пользоваться KalkanCheck нельзя. Можешь закрыть страницу или вернуться и прочитать условия ещё раз.",
    again: "Вернуться к условиям",
    leave: "Выйти",
    updated: "Обновлено",
  },
  ky: {
    title: "Баштоодон мурун",
    lead: "KalkanCheck кантип иштээри тууралуу кыскача:",
    points: [
      "Текшерүүгө жөнөткөн нерсеңди Google Gemini ЖИ талдайт. Биз аны сактабайбыз.",
      "Алдамчыларга даттануулар гана сакталат — сен тууралуу маалыматсыз.",
      "Текшерүү — кеңеш, кепилдик эмес. Документтердин чыныгы экенин тастыктабайбыз.",
      "Документтердин сүрөтүндө паспорттун жана картанын номерлерин жап.",
    ],
    read: "Кененирээк:",
    privacy: "Купуялык саясаты",
    terms: "Колдонуучу келишими",
    accept: "Кабыл алам",
    cancel: "Жокко чыгаруу",
    declinedTitle: "Сен шарттарды кабыл алган жоксуң",
    declinedText: "Шарттарга макул болбостон KalkanCheckти колдонууга болбойт. Баракты жаап же кайтып келип, шарттарды кайра окусаң болот.",
    again: "Шарттарга кайтуу",
    leave: "Чыгуу",
    updated: "Жаңыртылды",
  },
  en: {
    title: "Before you start",
    lead: "In short, how KalkanCheck works:",
    points: [
      "What you submit is analysed by Google Gemini AI. We don’t save it.",
      "Only reports about scammers are stored — without data about you.",
      "A check is a hint, not a guarantee. We don’t confirm that documents are genuine.",
      "Cover passport and card numbers on document photos.",
    ],
    read: "Read more:",
    privacy: "Privacy policy",
    terms: "Terms of use",
    accept: "I accept",
    cancel: "Cancel",
    declinedTitle: "You didn’t accept the terms",
    declinedText: "KalkanCheck can’t be used without accepting the terms. You can close the page or go back and read the terms again.",
    again: "Back to the terms",
    leave: "Leave",
    updated: "Updated",
  },
};
