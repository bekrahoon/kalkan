import type { Lang } from "@/lib/types";

/*
 * Results of scripts/eval-links.mts (raw data: docs/eval/links-2026-10-15.json).
 * Re-run before a demo and update these numbers together with the date.
 */
export const ACCURACY = {
  date: "15.10.2026",
  phishing: 200,
  warnedWithLists: 180,
  warnedOwnOnly: 171,
  legit: 100,
  legitFalseAlarms: 0,
  legitSafe: 85,
  legitUnknown: 15,
};

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;

export const ACCURACY_TEXT: Record<Lang, { title: string; lead: string; tiles: [string, string][]; methodTitle: string; method: string[] }> = {
  ru: {
    title: "Насколько точен KalkanCheck",
    lead: `Проверка от ${ACCURACY.date}: настоящие фишинговые ссылки и настоящие сайты Кыргызстана. Считались только технические проверки, без ИИ.`,
    tiles: [
      [pct(ACCURACY.warnedWithLists, ACCURACY.phishing), `фишинговых ссылок получили предупреждение (${ACCURACY.warnedWithLists} из ${ACCURACY.phishing})`],
      [pct(ACCURACY.warnedOwnOnly, ACCURACY.phishing), `поймано собственными проверками KalkanCheck, без готовых списков фишинга (${ACCURACY.warnedOwnOnly} из ${ACCURACY.phishing})`],
      [`${ACCURACY.legitFalseAlarms} из ${ACCURACY.legit}`, "ложных тревог на настоящих сайтах банков, госорганов, СМИ и магазинов КР"],
    ],
    methodTitle: "Как считали и что важно знать",
    method: [
      "Фишинг: 100 свежих ссылок из базы OpenPhish и 100 из базы Phishing Army, выбранных случайно. Настоящие сайты: 100 сайтов, которыми пользуются в Кыргызстане.",
      "Базу OpenPhish KalkanCheck использует и сам, поэтому отдельно посчитано, сколько поймано без неё — только по адресу, возрасту сайта, хостингу и тому, что просит страница.",
      `${ACCURACY.legitSafe} настоящих сайтов получили «Признаков обмана нет», ${ACCURACY.legitUnknown} — «Нет данных»: они не открылись с нашего сервера или это платформы вроде YouTube. «Нет данных» — не тревога.`,
      "После первого прогона мы исправили две ошибки, которые давали ложные тревоги, и проверили заново на новой выборке фишинга. Список настоящих сайтов остался тем же, поэтому результат на нём — оптимистичный.",
      "ИИ в этой проверке не участвовал. На сайте он дополнительно читает страницу и сообщения, но может и ошибаться.",
    ],
  },
  ky: {
    title: "KalkanCheck канчалык так",
    lead: `${ACCURACY.date} текшерүү: чыныгы фишинг шилтемелери жана Кыргызстандын чыныгы сайттары. ЖИсиз, техникалык текшерүүлөр гана эсептелди.`,
    tiles: [
      [pct(ACCURACY.warnedWithLists, ACCURACY.phishing), `фишинг шилтемелерине эскертүү берилди (${ACCURACY.phishing} ичинен ${ACCURACY.warnedWithLists})`],
      [pct(ACCURACY.warnedOwnOnly, ACCURACY.phishing), `даяр фишинг тизмелерисиз, KalkanCheckтин өз текшерүүлөрү менен кармалды (${ACCURACY.phishing} ичинен ${ACCURACY.warnedOwnOnly})`],
      [`${ACCURACY.legit} ичинен ${ACCURACY.legitFalseAlarms}`, "КРдин банктарынын, мамлекеттик органдарынын, ЖМКлардын жана дүкөндөрүнүн чыныгы сайттарында жалган эскертүү"],
    ],
    methodTitle: "Кантип эсептедик жана эмнени билүү керек",
    method: [
      "Фишинг: OpenPhish базасынан 100 жана Phishing Army базасынан 100 жаңы шилтеме, кокустан тандалган. Чыныгы сайттар: Кыргызстанда колдонулган 100 сайт.",
      "OpenPhish базасын KalkanCheck өзү да колдонот, ошондуктан ансыз канчасы кармалганы өзүнчө эсептелди — дарек, сайттын жашы, хостинг жана барак эмне сурап жатканы боюнча гана.",
      `${ACCURACY.legitSafe} чыныгы сайт «Алдоонун белгилери жок» алды, ${ACCURACY.legitUnknown} — «Маалымат жок»: алар биздин серверден ачылган жок же YouTube сыяктуу платформалар. «Маалымат жок» — эскертүү эмес.`,
      "Биринчи текшерүүдөн кийин жалган эскертүү берген эки катаны оңдоп, фишингдин жаңы тандоосунда кайра текшердик. Чыныгы сайттардын тизмеси ошол эле калды, ошондуктан андагы жыйынтык — оптимисттик.",
      "Бул текшерүүгө ЖИ катышкан жок. Сайтта ал баракты жана билдирүүлөрдү кошумча окуйт, бирок жаңылышы да мүмкүн.",
    ],
  },
  en: {
    title: "How accurate KalkanCheck is",
    lead: `Test of ${ACCURACY.date}: real phishing links and real websites of Kyrgyzstan. Only the technical checks were counted, without the AI.`,
    tiles: [
      [pct(ACCURACY.warnedWithLists, ACCURACY.phishing), `of phishing links got a warning (${ACCURACY.warnedWithLists} of ${ACCURACY.phishing})`],
      [pct(ACCURACY.warnedOwnOnly, ACCURACY.phishing), `caught by KalkanCheck’s own checks, without ready-made phishing lists (${ACCURACY.warnedOwnOnly} of ${ACCURACY.phishing})`],
      [`${ACCURACY.legitFalseAlarms} of ${ACCURACY.legit}`, "false alarms on real websites of Kyrgyz banks, government bodies, media and shops"],
    ],
    methodTitle: "How we measured and what to know",
    method: [
      "Phishing: 100 fresh links from the OpenPhish database and 100 from Phishing Army, picked at random. Real sites: 100 websites people use in Kyrgyzstan.",
      "KalkanCheck itself uses the OpenPhish database, so we also counted how many were caught without it — only by the address, site age, hosting and what the page asks for.",
      `${ACCURACY.legitSafe} real sites got “No signs of a scam”, ${ACCURACY.legitUnknown} got “Not enough data”: they didn’t open from our server or they are platforms like YouTube. “Not enough data” is not an alarm.`,
      "After the first run we fixed two bugs that caused false alarms and re-tested on a new phishing sample. The list of real sites stayed the same, so the result on it is optimistic.",
      "The AI did not take part in this test. On the website it also reads the page and messages, but it can make mistakes too.",
    ],
  },
};
