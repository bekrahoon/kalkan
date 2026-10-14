/**
 * Popular services for the "Rating" page. Each one is found in Google Play (by app id or search query),
 * and its privacy policy link is taken from the Play listing. Results live in rating-data.json.
 */
export interface RatingService {
  id: string;
  name: string;
  category: { ru: string; ky: string };
  /** Google Play app id, if known. */
  appId?: string;
  /** Otherwise searched in Google Play (Kyrgyzstan store). */
  query?: string;
  /** Or a direct policy URL. */
  url?: string;
}

const C = {
  messenger: { ru: "Мессенджер", ky: "Мессенджер" },
  social: { ru: "Соцсеть", ky: "Социалдык тармак" },
  taxi: { ru: "Такси и доставка", ky: "Такси жана жеткирүү" },
  shop: { ru: "Покупки", ky: "Соода" },
  bank: { ru: "Банк и платежи", ky: "Банк жана төлөмдөр" },
  maps: { ru: "Карты", ky: "Карталар" },
  telecom: { ru: "Мобильная связь", ky: "Мобилдик байланыш" },
  kids: { ru: "Детям и подросткам", ky: "Балдарга жана өспүрүмдөргө" },
};

// Wildberries, lalafo and «Мой О!» were left out for now: their policy pages block automated reading.
export const RATING_SERVICES: RatingService[] = [
  { id: "telegram", name: "Telegram", category: C.messenger, appId: "org.telegram.messenger" },
  { id: "whatsapp", name: "WhatsApp", category: C.messenger, appId: "com.whatsapp" },
  { id: "instagram", name: "Instagram", category: C.social, appId: "com.instagram.android" },
  { id: "tiktok", name: "TikTok", category: C.social, appId: "com.zhiliaoapp.musically" },
  { id: "yandex-go", name: "Яндекс Go", category: C.taxi, appId: "ru.yandex.taxi" },
  { id: "glovo", name: "Glovo", category: C.taxi, appId: "com.glovo" },
  { id: "mbank", name: "MBANK", category: C.bank, query: "MBANK мобильный банк Кыргызстан" },
  { id: "megacom", name: "MegaCom", category: C.telecom, query: "MegaCom Кыргызстан" },
  { id: "2gis", name: "2ГИС", category: C.maps, appId: "ru.dublgis.dgismobile" },
  { id: "youtube", name: "YouTube", category: C.kids, appId: "com.google.android.youtube" },
  { id: "roblox", name: "Roblox", category: C.kids, appId: "com.roblox.client" },
  { id: "brawl-stars", name: "Brawl Stars", category: C.kids, appId: "com.supercell.brawlstars" },
  { id: "minecraft", name: "Minecraft", category: C.kids, appId: "com.mojang.minecraftpe" },
];
