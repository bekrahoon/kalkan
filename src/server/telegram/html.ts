/** Escapes text for Telegram messages sent with parse_mode "HTML" (names, AI output, user text). */
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
