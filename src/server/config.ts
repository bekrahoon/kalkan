import "server-only";

/**
 * Public address of the site. Links in bot messages and the Telegram webhook use this value,
 * never the Host header of a request (which a client controls).
 */
export const SITE_URL = (process.env.SITE_URL || "https://kalkan-sigma.vercel.app").replace(/\/$/, "");
