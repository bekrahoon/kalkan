import type { Lang, SchemeId } from "@/lib/types";

/* Common fraud schemes. Used by the /schemes page, the verdict screen and the Telegram bot. */

export interface Scheme {
  name: string;
  how: string;
  signs: string[];
  todo: string[];
}

export const SCHEMES: Record<Lang, Record<SchemeId, Scheme>> = {
  ru: {
    fake_bank: {
      name: "«Служба безопасности банка»",
      how: "Звонят или пишут от имени банка: «по вашей карте подозрительная операция». Просят код из SMS, данные карты или перевести деньги на «безопасный счёт».",
      signs: ["Звонок или сообщение первым — не ты обратился", "Торопят и пугают блокировкой", "Просят код из SMS или перевод"],
      todo: ["Положи трубку", "Перезвони в банк сам по номеру на обороте карты"],
    },
    relative: {
      name: "«Мама, я попал в беду»",
      how: "Пишут с нового номера от имени родственника или друга: срочно нужны деньги, попал в аварию, задержали, сломался телефон.",
      signs: ["Новый или незнакомый номер", "Срочность и просьба никому не говорить", "Перевод на чужую карту"],
      todo: ["Позвони родственнику на его старый номер", "Задай вопрос, ответ на который знает только он"],
    },
    voting: {
      name: "«Проголосуй за меня»",
      how: "Знакомый (его аккаунт уже взломан) просит проголосовать за ребёнка в конкурсе. Ссылка ведёт на поддельный вход в Telegram или WhatsApp — и аккаунт уводят.",
      signs: ["Ссылка на «голосование» или «конкурс»", "Для голоса просят войти через Telegram или WhatsApp", "Просят номер телефона и код"],
      todo: ["Не вводи номер и код", "Включи облачный пароль в Telegram: Настройки → Конфиденциальность"],
    },
    sms_code: {
      name: "«Продиктуй код»",
      how: "Под любым предлогом просят назвать код, который пришёл в SMS или Telegram: «отправил тебе по ошибке», «для подтверждения доставки», «для приза».",
      signs: ["Просят код из SMS, Telegram или WhatsApp", "Говорят, что код пришёл «по ошибке»"],
      todo: ["Никогда никому не называй коды", "Если назвал — сразу завершай чужие сеансы и меняй пароли"],
    },
    prize: {
      name: "Выигрыш и подарки",
      how: "«Вы выиграли телефон» или «вам положена выплата». Чтобы получить, нужно оплатить «доставку», «налог» или ввести данные карты.",
      signs: ["Ты ни в чём не участвовал", "Нужно заплатить, чтобы получить", "Сайт или аккаунт похожи на известную компанию"],
      todo: ["Ничего не оплачивай", "Проверь новость на официальном сайте компании"],
    },
    investment: {
      name: "Инвестиции и крипта",
      how: "Обещают большой доход без риска: «30% в неделю», «бот для трейдинга», «закрытый канал». Сначала дают вывести немного, потом забирают всё.",
      signs: ["Гарантированная высокая доходность", "Просят привести друзей", "Деньги нужно перевести на карту человека"],
      todo: ["Не вкладывай туда, где обещают гарантированный доход", "Проверь лицензию компании в Нацбанке"],
    },
    job: {
      name: "Лёгкая работа",
      how: "«Ставь лайки за деньги», «работа из дома, 5000 в день». Сначала платят копейки, потом просят «вложиться», чтобы получить больше заданий.",
      signs: ["Высокая оплата за простую работу", "Просят оплатить обучение, взнос или задания"],
      todo: ["Настоящий работодатель не берёт деньги с работника", "Не передавай свою карту и данные для «зарплаты»"],
    },
    marketplace: {
      name: "Покупка и продажа на объявлениях",
      how: "«Покупатель» с Lalafo или другого сайта хочет оплатить «через доставку» и присылает ссылку, где нужно ввести данные карты, «чтобы получить деньги».",
      signs: ["Уводят общение в WhatsApp или Telegram", "Ссылка на «получение оплаты»", "Чтобы получить деньги, просят данные карты"],
      todo: ["Для получения денег достаточно номера карты или телефона — CVV и код не нужны никогда", "Общайся внутри самого сайта объявлений"],
    },
    fake_gov: {
      name: "От имени госорганов",
      how: "Пишут или звонят «из милиции», «налоговой», «Түндүка»: штраф, долг, проверка, «ваши данные использовали». Просят оплатить по ссылке или назвать код.",
      signs: ["Угрозы и срочность", "Оплата по ссылке или на карту человека", "Звонят в мессенджере, а не официально"],
      todo: ["Госорганы не просят коды и переводы по телефону", "Проверь информацию на официальном сайте gov.kg"],
    },
    loan: {
      name: "Займы и кредиты",
      how: "Предлагают займ без проверок, но просят «страховку» или «комиссию» заранее. Или приложение займа получает доступ к контактам и потом давит на знакомых.",
      signs: ["Нужно заплатить до получения денег", "Приложение просит доступ к контактам и SMS", "Компании нет в реестре Нацбанка"],
      todo: ["Не плати заранее за займ", "Бери займы только у лицензированных организаций"],
    },
    fake_shop: {
      name: "Поддельный магазин",
      how: "Товар намного дешевле, чем везде. Только предоплата на карту человека, после оплаты продавец пропадает.",
      signs: ["Цена сильно ниже рынка", "Только предоплата, без доставки с оплатой при получении", "Аккаунту или сайту несколько недель"],
      todo: ["Плати при получении или через защищённые сервисы", "Поищи отзывы о магазине"],
    },
    phishing: {
      name: "Поддельный сайт",
      how: "Сайт выглядит как банк, почта или соцсеть, но адрес другой. Всё, что ты вводишь — логин, пароль, карту — получают мошенники.",
      signs: ["Адрес похож на настоящий, но отличается буквой или окончанием", "Просят ввести логин, пароль или данные карты"],
      todo: ["Заходи в банк только через его приложение или набирая адрес сам", "Сверяй адрес в браузере"],
    },
    deepfake: {
      name: "Поддельный голос или видео",
      how: "С помощью ИИ подделывают голос или видео знакомого, начальника или знаменитости и просят перевести деньги или «вложиться».",
      signs: ["Голосовое или видео с необычной просьбой о деньгах", "Человек не может ответить на личный вопрос", "Знаменитость «рекламирует» инвестиции"],
      todo: ["Перезвони человеку сам", "Договорись с близкими о кодовом слове"],
    },
  },
  ky: {
    fake_bank: {
      name: "«Банктын коопсуздук кызматы»",
      how: "Банктын атынан чалышат же жазышат: «картаңызда шектүү операция». SMS кодун, картанын маалыматын сурашат же акчаны «коопсуз эсепке» которууну талап кылышат.",
      signs: ["Алар биринчи чалышат же жазышат", "Шаштырып, бөгөттөө менен коркутушат", "SMS кодун же акча которууну сурашат"],
      todo: ["Телефонду кой", "Банкка картанын артындагы номер аркылуу өзүң чал"],
    },
    relative: {
      name: "«Апа, мен кырсыкка кабылдым»",
      how: "Туугандын же досуңдун атынан жаңы номерден жазышат: шашылыш акча керек, кырсыкка кабылды, кармалды, телефону бузулду.",
      signs: ["Жаңы же тааныш эмес номер", "Шаштыруу жана эч кимге айтпа деген өтүнүч", "Бөтөн картага которуу"],
      todo: ["Туугандын эски номерине чал", "Ал гана жообун билген суроо бер"],
    },
    voting: {
      name: "«Мага добуш бер»",
      how: "Тааныш (анын аккаунту буга чейин бузулган) сынакта баласына добуш берүүнү суранат. Шилтеме Telegram же WhatsAppка жасалма кирүүгө алып барат — аккаунтту уурдашат.",
      signs: ["«Добуш берүү» же «сынак» шилтемеси", "Добуш үчүн Telegram же WhatsApp аркылуу кирүүнү сурашат", "Телефон номерин жана кодду сурашат"],
      todo: ["Номерди жана кодду киргизбе", "Telegramда булут сырсөзүн күйгүз: Жөндөөлөр → Купуялык"],
    },
    sms_code: {
      name: "«Кодду айтып берчи»",
      how: "Ар кандай шылтоо менен SMS же Telegramга келген кодду айтууну сурашат: «жаңылыш жөнөтүп алдым», «жеткирүүнү тастыктоо үчүн», «сыйлык үчүн».",
      signs: ["SMS, Telegram же WhatsAppтагы кодду сурашат", "Код «жаңылыштык менен» келди дешет"],
      todo: ["Коддорду эч качан эч кимге айтпа", "Эгер айтып койсоң — дароо бөтөн сеанстарды жаап, сырсөздөрдү алмаштыр"],
    },
    prize: {
      name: "Утуш жана белектер",
      how: "«Сиз телефон уттуңуз» же «сизге төлөм тиешелүү». Алуу үчүн «жеткирүүнү», «салыкты» төлөө же картанын маалыматын киргизүү керек.",
      signs: ["Сен эч нерсеге катышкан эмессиң", "Алуу үчүн төлөш керек", "Сайт же аккаунт белгилүү компанияга окшош"],
      todo: ["Эч нерсе төлөбө", "Жаңылыкты компаниянын расмий сайтынан текшер"],
    },
    investment: {
      name: "Инвестициялар жана крипта",
      how: "Тобокелсиз чоң киреше убада кылышат: «жумасына 30%», «трейдинг үчүн бот», «жабык канал». Адегенде бир аз чыгарууга беришет, андан кийин баарын алышат.",
      signs: ["Кепилденген жогорку киреше", "Досторуңду алып келүүнү сурашат", "Акчаны адамдын картасына которуу керек"],
      todo: ["Кепилденген киреше убада кылган жерге салба", "Компаниянын лицензиясын Улуттук банктан текшер"],
    },
    job: {
      name: "Жеңил жумуш",
      how: "«Лайк басып акча тап», «үйдөн иштөө, күнүнө 5000». Адегенде тыйын төлөшөт, андан кийин көбүрөөк тапшырма алуу үчүн «салым кошууну» сурашат.",
      signs: ["Жөнөкөй жумуш үчүн чоң акы", "Окуу, взнос же тапшырмалар үчүн төлөөнү сурашат"],
      todo: ["Чыныгы иш берүүчү кызматкерден акча албайт", "«Айлык» үчүн картаңды жана маалыматыңды бербе"],
    },
    marketplace: {
      name: "Жарнамалар аркылуу сатуу жана сатып алуу",
      how: "Lalafo же башка сайттан «сатып алуучу» «жеткирүү аркылуу» төлөгүсү келет жана «акча алуу үчүн» картанын маалыматын киргизүү керек болгон шилтеме жөнөтөт.",
      signs: ["Сүйлөшүүнү WhatsApp же Telegramга алып кетишет", "«Төлөм алуу» шилтемеси", "Акча алуу үчүн картанын маалыматын сурашат"],
      todo: ["Акча алуу үчүн картанын же телефондун номери жетиштүү — CVV жана код эч качан керек эмес", "Жарнама сайтынын ичинде сүйлөш"],
    },
    fake_gov: {
      name: "Мамлекеттик органдардын атынан",
      how: "«Милициядан», «салыктан», «Түндүктөн» жазышат же чалышат: айып, карыз, текшерүү, «маалыматыңызды колдонушту». Шилтеме аркылуу төлөөнү же кодду айтууну сурашат.",
      signs: ["Коркутуу жана шаштыруу", "Шилтеме аркылуу же адамдын картасына төлөө", "Расмий эмес, мессенджерден чалышат"],
      todo: ["Мамлекеттик органдар телефон аркылуу код жана которуу сурабайт", "Маалыматты gov.kg расмий сайтынан текшер"],
    },
    loan: {
      name: "Насыялар жана кредиттер",
      how: "Текшерүүсүз насыя сунушташат, бирок алдын ала «камсыздандыруу» же «комиссия» сурашат. Же насыя тиркемеси байланыштарга кирүү укугун алып, кийин тааныштарыңа кысым көрсөтөт.",
      signs: ["Акча алганга чейин төлөш керек", "Тиркеме байланыштарга жана SMSке уруксат сурайт", "Компания Улуттук банктын реестринде жок"],
      todo: ["Насыя үчүн алдын ала төлөбө", "Насыяны лицензиясы бар уюмдардан гана ал"],
    },
    fake_shop: {
      name: "Жасалма дүкөн",
      how: "Товар башка жерлерге караганда алда канча арзан. Адамдын картасына алдын ала төлөм гана, төлөгөндөн кийин сатуучу жоголот.",
      signs: ["Баасы базардагыдан бир топ төмөн", "Алдын ала төлөм гана, алганда төлөө жок", "Аккаунтка же сайтка бир нече жума"],
      todo: ["Алганда же корголгон сервистер аркылуу төлө", "Дүкөн тууралуу пикирлерди изде"],
    },
    phishing: {
      name: "Жасалма сайт",
      how: "Сайт банк, почта же социалдык тармак сыяктуу көрүнөт, бирок дареги башка. Сен киргизген нерсенин баарын — логин, сырсөз, карта — алдамчылар алат.",
      signs: ["Дарек чыныгысына окшош, бирок бир тамга же аягы менен айырмаланат", "Логин, сырсөз же картанын маалыматын киргизүүнү сурашат"],
      todo: ["Банкка анын тиркемеси аркылуу же даректи өзүң терип гана кир", "Браузердеги даректи салыштыр"],
    },
    deepfake: {
      name: "Жасалма үн же видео",
      how: "ЖИнин жардамы менен тааныштын, жетекчинин же белгилүү адамдын үнүн же видеосун жасалмалап, акча которууну же «салым кошууну» сурашат.",
      signs: ["Акча тууралуу адаттан тыш өтүнүч менен үн же видео билдирүү", "Адам жеке суроого жооп бере албайт", "Белгилүү адам инвестицияны «жарнамалайт»"],
      todo: ["Адамга өзүң кайра чал", "Жакындарың менен коддуу сөз макулдаш"],
    },
  },
  en: {
    fake_bank: {
      name: "“Bank security service”",
      how: "They call or write in the name of a bank: “a suspicious transaction on your card”. They ask for the SMS code, card details or a transfer to a “safe account”.",
      signs: ["They contacted you first — you didn’t call them", "They rush you and threaten to block the card", "They ask for an SMS code or a transfer"],
      todo: ["Hang up", "Call the bank yourself on the number on the back of your card"],
    },
    relative: {
      name: "“Mum, I’m in trouble”",
      how: "Someone writes from a new number pretending to be a relative or friend: money is needed urgently, there was an accident, they were detained, the phone broke.",
      signs: ["A new or unknown number", "Urgency and a request to tell no one", "Transfer to someone else’s card"],
      todo: ["Call your relative on their old number", "Ask a question only they would know the answer to"],
    },
    voting: {
      name: "“Vote for me”",
      how: "A friend (whose account is already hacked) asks you to vote for a child in a contest. The link leads to a fake Telegram or WhatsApp login — and your account is stolen.",
      signs: ["A link to a “vote” or “contest”", "To vote you must log in with Telegram or WhatsApp", "They ask for your phone number and code"],
      todo: ["Don’t enter your number or code", "Turn on a cloud password in Telegram: Settings → Privacy"],
    },
    sms_code: {
      name: "“Read me the code”",
      how: "Under any pretext they ask for the code you received by SMS or Telegram: “sent it to you by mistake”, “to confirm delivery”, “for the prize”.",
      signs: ["They ask for a code from SMS, Telegram or WhatsApp", "They say the code came “by mistake”"],
      todo: ["Never tell anyone your codes", "If you did — end other sessions right away and change passwords"],
    },
    prize: {
      name: "Prizes and gifts",
      how: "“You’ve won a phone” or “you’re owed a payout”. To get it you must pay for “delivery”, a “tax” or enter your card details.",
      signs: ["You didn’t enter anything", "You must pay to receive", "The site or account looks like a well-known company"],
      todo: ["Don’t pay anything", "Check the news on the company’s official website"],
    },
    investment: {
      name: "Investments and crypto",
      how: "They promise big income with no risk: “30% a week”, “trading bot”, “private channel”. First they let you withdraw a little, then they take everything.",
      signs: ["Guaranteed high returns", "They ask you to bring friends", "Money must go to a person’s card"],
      todo: ["Don’t invest where guaranteed income is promised", "Check the company’s licence with the National Bank"],
    },
    job: {
      name: "Easy job",
      how: "“Get paid for likes”, “work from home, 5,000 a day”. First they pay pennies, then ask you to “invest” to get more tasks.",
      signs: ["High pay for simple work", "They ask you to pay for training, a fee or tasks"],
      todo: ["A real employer doesn’t take money from workers", "Don’t hand over your card or data for a “salary”"],
    },
    marketplace: {
      name: "Buying and selling on classifieds",
      how: "A “buyer” from Lalafo or another site wants to pay “via delivery” and sends a link where you must enter card details “to receive the money”.",
      signs: ["They move the chat to WhatsApp or Telegram", "A link to “receive payment”", "They ask for card details so you can get money"],
      todo: ["To receive money, a card or phone number is enough — CVV and codes are never needed", "Keep the conversation inside the classifieds site"],
    },
    fake_gov: {
      name: "In the name of the authorities",
      how: "They write or call “from the police”, “the tax office”, “Tunduk”: a fine, a debt, an inspection, “your data was used”. They ask you to pay via a link or give a code.",
      signs: ["Threats and urgency", "Payment via a link or to a person’s card", "They call via a messenger, not officially"],
      todo: ["Government bodies don’t ask for codes or transfers by phone", "Check the information on the official gov.kg website"],
    },
    loan: {
      name: "Loans and credit",
      how: "They offer a loan without checks but ask for “insurance” or a “fee” upfront. Or a loan app gets access to your contacts and later pressures your friends.",
      signs: ["You must pay before getting the money", "The app asks for access to contacts and SMS", "The company isn’t in the National Bank register"],
      todo: ["Never pay upfront for a loan", "Borrow only from licensed organisations"],
    },
    fake_shop: {
      name: "Fake shop",
      how: "The item is much cheaper than anywhere else. Prepayment only, to a person’s card; after payment the seller disappears.",
      signs: ["Price far below the market", "Prepayment only, no cash on delivery", "The account or site is a few weeks old"],
      todo: ["Pay on delivery or via protected services", "Look for reviews of the shop"],
    },
    phishing: {
      name: "Fake website",
      how: "The site looks like a bank, email or social network, but the address is different. Everything you enter — login, password, card — goes to the scammers.",
      signs: ["The address looks like the real one but differs by a letter or ending", "They ask for a login, password or card details"],
      todo: ["Open your bank only via its app or by typing the address yourself", "Check the address in the browser"],
    },
    deepfake: {
      name: "Fake voice or video",
      how: "AI is used to fake the voice or video of a friend, boss or celebrity asking you to send money or “invest”.",
      signs: ["A voice or video message with an unusual request for money", "The person can’t answer a personal question", "A celebrity “advertises” investments"],
      todo: ["Call the person back yourself", "Agree on a code word with your family"],
    },
  },
};
