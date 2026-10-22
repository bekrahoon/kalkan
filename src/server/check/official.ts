/**
 * Real domains of brands that scammers like to imitate in Kyrgyzstan.
 * `keywords` are what a fake domain usually contains ("mbank-bonus.top").
 * Add a brand here before adding it to any text: a wrong domain would mark the real site as fake.
 */
export interface Brand {
  name: string;
  domains: string[];
  keywords: string[];
  /** Banks and payment services: imitating them is a strong sign of fraud. */
  money?: boolean;
}

export const BRANDS: Brand[] = [
  { name: "MBANK", domains: ["mbank.kg"], keywords: ["mbank", "мбанк"], money: true },
  { name: "Optima Bank", domains: ["optimabank.kg"], keywords: ["optimabank", "optima-bank"], money: true },
  { name: "Demir Bank", domains: ["demirbank.kg"], keywords: ["demirbank", "demir-bank"], money: true },
  { name: "KICB", domains: ["kicb.net"], keywords: ["kicb"], money: true },
  { name: "Bakai Bank", domains: ["bakai.kg"], keywords: ["bakaibank", "bakai-bank"], money: true },
  { name: "РСК Банк", domains: ["rsk.kg"], keywords: ["rskbank", "rsk-bank"], money: true },
  { name: "Айыл Банк", domains: ["ab.kg"], keywords: ["aiylbank", "aiyl-bank", "ayilbank"], money: true },
  { name: "Keremet Bank", domains: ["keremetbank.kg"], keywords: ["keremetbank", "keremet-bank"], money: true },
  { name: "Компаньон", domains: ["kompanion.kg"], keywords: ["kompanionbank", "kompanion-bank"], money: true },
  { name: "Элсом", domains: ["elsom.kg"], keywords: ["elsom"], money: true },
  { name: "Balance.kg", domains: ["balance.kg"], keywords: ["balancekg", "balance-kg"], money: true },
  { name: "Kaspi", domains: ["kaspi.kz"], keywords: ["kaspi"], money: true },
  { name: "Binance", domains: ["binance.com"], keywords: ["binance"], money: true },
  { name: "MegaCom", domains: ["megacom.kg"], keywords: ["megacom", "mega-com"] },
  { name: "Beeline", domains: ["beeline.kg"], keywords: ["beeline"] },
  { name: "О!", domains: ["o.kg", "nurtelecom.kg"], keywords: ["nurtelecom", "odengi", "o-dengi"] },
  { name: "Түндүк", domains: ["tunduk.kg"], keywords: ["tunduk", "tyndyk"] },
  { name: "Салык", domains: ["salyk.kg"], keywords: ["salyk"] },
  { name: "Lalafo", domains: ["lalafo.kg", "lalafo.com"], keywords: ["lalafo"] },
  { name: "Telegram", domains: ["telegram.org", "t.me", "telegram.me", "telegra.ph"], keywords: ["telegram", "teleqram", "telegrarn", "teiegram"] },
  { name: "WhatsApp", domains: ["whatsapp.com", "wa.me", "whatsapp.net"], keywords: ["whatsapp", "whatsap"] },
  { name: "Instagram", domains: ["instagram.com"], keywords: ["instagram", "instagrarn"] },
  { name: "Facebook", domains: ["facebook.com", "fb.com", "meta.com"], keywords: ["facebook"] },
  { name: "Wildberries", domains: ["wildberries.ru", "wildberries.kg", "wb.ru"], keywords: ["wildberries", "wildberies"] },
  { name: "Ozon", domains: ["ozon.ru", "ozon.kg"], keywords: ["ozon"] },
  { name: "Яндекс", domains: ["yandex.ru", "yandex.com", "yandex.kg", "ya.ru"], keywords: ["yandex"] },
  { name: "Glovo", domains: ["glovoapp.com"], keywords: ["glovo"] },
];

/** Big well-known services: not "official KG brands", but their own domains are not scam sites. */
export const KNOWN_DOMAINS = new Set([
  "google.com", "google.kg", "youtube.com", "youtu.be", "gmail.com", "apple.com", "icloud.com", "microsoft.com",
  "live.com", "office.com", "tiktok.com", "vk.com", "ok.ru", "mail.ru", "github.com", "wikipedia.org",
  "linkedin.com", "x.com", "twitter.com", "zoom.us", "netflix.com", "spotify.com", "amazon.com", "aliexpress.com",
  "aliexpress.ru", "temu.com", "house.kg", "mashina.kg", "24.kg", "kaktus.media", "akipress.org", "kabar.kg",
  "azattyk.org", "sputnik.kg", "kloop.kg", "2gis.kg", "2gis.ru", "namba.kg", "diesel.elcat.kg", "elcat.kg",
  "play.google.com", "apps.apple.com",
  ...BRANDS.flatMap((b) => b.domains),
]);

/** URL shorteners: we follow them and judge the real destination. */
export const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "cutt.ly", "is.gd", "t.co", "clck.ru", "goo.su", "u.to", "vk.cc", "rebrand.ly",
  "shorturl.at", "tiny.cc", "ow.ly", "rb.gy", "s.id", "qps.ru", "surl.li", "l.wl.co",
]);

/** Free website builders and hosting: fine for hobby sites, but a bank never lives there. */
export const FREE_HOSTING = [
  // dynamic DNS and instant site builders, popular with phishing kits
  "duckdns.org", "ddns.net", "hopto.org", "zapto.org", "no-ip.org", "freeddns.org", "dynu.net", "abrdns.com", "typedream.app",
  "glide.page", "weeblysite.com", "mystrikingly.com", "godaddysites.com", "start.page", "linktr.ee", "ipfs.io", "r2.dev",
  "vercel.app", "netlify.app", "github.io", "pages.dev", "workers.dev", "web.app", "firebaseapp.com", "glitch.me",
  "tilda.ws", "wixsite.com", "weebly.com", "000webhostapp.com", "blogspot.com", "ngrok-free.app", "ngrok.io",
  "trycloudflare.com", "onrender.com", "replit.app", "repl.co", "herokuapp.com", "framer.website", "webflow.io",
  "square.site", "sites.google.com", "forms.gle", "carrd.co", "wordpress.com", "mya5.ru", "ucoz.net", "ucoz.ru",
];

/** Zones that are cheap and popular with phishing kits (not proof, just a hint). */
export const RISKY_TLDS = new Set([
  "top", "xyz", "icu", "online", "site", "live", "click", "buzz", "cfd", "sbs", "rest", "quest", "monster", "cyou",
  "shop", "store", "fun", "space", "website", "lol", "bond", "autos", "mom", "beauty", "hair", "skin", "makeup",
  "zip", "mov", "work", "support", "help", "info", "pw", "tk", "ml", "ga", "cf", "gq",
]);

export function brandForDomain(domain: string): Brand | null {
  return BRANDS.find((b) => b.domains.includes(domain)) ?? null;
}

/** Undo the usual tricks: 0→o, 1→l, rn→m, extra dashes. */
export function deobfuscate(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/rn/g, "m")
    .replace(/vv/g, "w")
    .replace(/[-_.]/g, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/**
 * Does this (non-official) domain pretend to be a known brand?
 * Checks the brand name inside the address and near-miss spellings of the real domain.
 */
export function imitatedBrand(host: string, domain: string, domainLabel: string): Brand | null {
  if (KNOWN_DOMAINS.has(domain)) return null;
  const flat = deobfuscate(host);
  for (const b of BRANDS) {
    if (b.keywords.some((k) => flat.includes(deobfuscate(k)))) return b;
  }
  for (const b of BRANDS) {
    for (const d of b.domains) {
      const label = d.split(".")[0];
      if (label.length < 6) continue;
      const dist = levenshtein(deobfuscate(domainLabel), label);
      if (dist > 0 && dist <= (label.length >= 9 ? 2 : 1)) return b;
    }
  }
  return null;
}

/** Brand names as people write them on a page ("MBank", "Оптима"). */
export function brandMentioned(text: string): Brand | null {
  const t = text.toLowerCase();
  const names: [Brand["name"], RegExp][] = [
    ["MBANK", /\bm-?bank\b|мбанк/],
    ["Optima Bank", /optima\s*bank|оптима\s*банк/],
    ["Demir Bank", /demir\s*bank|демир\s*банк/],
    ["KICB", /\bkicb\b/],
    ["Bakai Bank", /bakai\s*bank|бакай\s*банк/],
    ["Элсом", /\belsom\b|элсом/],
    ["Kaspi", /\bkaspi\b|каспи/],
    ["Telegram", /\btelegram\b|телеграм/],
    ["WhatsApp", /\bwhatsapp\b|ватсап|вотсап/],
  ];
  for (const [name, re] of names) if (re.test(t)) return BRANDS.find((b) => b.name === name) ?? null;
  return null;
}
