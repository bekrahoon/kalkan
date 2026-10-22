const URL_RE =
  /\bhttps?:\/\/[^\s<>"'«»]+|\bwww\.[^\s<>"'«»]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:kg|kz|ru|uz|com|net|org|top|xyz|online|site|info|me|app|io|store|shop|live|click|link|pro|biz|cc|ws|icu|vip|club|world|space|fun|website|ly|su|gd|gl|co)\b(?:\/[^\s<>"'«»]*)?/gi;

export function findUrls(text: string): string[] {
  const found = (text.match(URL_RE) ?? []).map((u) => u.replace(/[).,;:!?»"']+$/, ""));
  // Drop e-mail domains ("ivan@mail.ru" → "mail.ru").
  const filtered = found.filter((u) => {
    const i = text.indexOf(u);
    return i <= 0 || text[i - 1] !== "@";
  });
  return [...new Set(filtered)].slice(0, 5);
}
