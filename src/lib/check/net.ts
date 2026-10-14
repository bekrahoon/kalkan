import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { CheckError } from "../ai";

/** Rejects localhost, private, link-local and other internal addresses (basic SSRF guard). */
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

export function parseUserUrl(input: string): URL {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new CheckError("invalid_url", 400);
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) throw new CheckError("invalid_url", 400);
  return url;
}

/** Throws blocked_url for internal addresses; returns false if the name does not resolve at all. */
export async function resolvesPublic(url: URL): Promise<boolean> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^localhost$|\.local$|\.internal$/i.test(host)) throw new CheckError("blocked_url", 400);
  let addrs: { address: string }[];
  try {
    addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  } catch {
    return false;
  }
  if (addrs.some((a) => isPrivateIp(a.address))) throw new CheckError("blocked_url", 400);
  return addrs.length > 0;
}

/** Phishing kits often hide from bots, so we look like an ordinary phone browser. */
const UA =
  "Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
const MAX_HTML_BYTES = 1_500_000;

export interface Hop {
  url: string;
  status: number;
}

export interface FetchedPage {
  ok: boolean;
  hops: Hop[];
  finalUrl: URL;
  html: string;
  /** Why the page could not be read, when ok=false. */
  problem?: "dns" | "timeout" | "error" | "status" | "not_html";
}

/**
 * Opens the link the way a phone would, following every redirect by hand
 * (each hop is checked against internal addresses) and recording the chain.
 */
export async function fetchPage(start: URL, budgetMs = 12_000): Promise<FetchedPage> {
  const deadline = Date.now() + budgetMs;
  let url = start;
  const hops: Hop[] = [];
  for (let i = 0; i < 8; i++) {
    if (!(await resolvesPublic(url))) return { ok: false, hops, finalUrl: url, html: "", problem: "dns" };
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language": "ru-RU,ru;q=0.9,ky;q=0.8,en;q=0.6",
        },
        signal: AbortSignal.timeout(Math.max(1_000, Math.min(8_000, deadline - Date.now()))),
      });
    } catch (e) {
      return { ok: false, hops, finalUrl: url, html: "", problem: (e as Error)?.name === "TimeoutError" ? "timeout" : "error" };
    }
    hops.push({ url: url.href, status: res.status });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      try {
        url = new URL(loc, url);
      } catch {
        return { ok: false, hops, finalUrl: url, html: "", problem: "error" };
      }
      if (!["http:", "https:"].includes(url.protocol)) return { ok: false, hops, finalUrl: url, html: "", problem: "error" };
      continue;
    }
    const type = res.headers.get("content-type") ?? "";
    if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) {
      return { ok: false, hops, finalUrl: url, html: "", problem: "not_html" };
    }
    const buf = await res.arrayBuffer().catch(() => new ArrayBuffer(0));
    const html = new TextDecoder("utf-8").decode(buf.slice(0, MAX_HTML_BYTES));

    // A page that only redirects with <meta refresh> or a one-line script counts as a redirect too.
    const next = scriptedRedirect(html, url);
    if (next && html.length < 20_000 && i < 7) {
      url = next;
      continue;
    }
    return { ok: res.ok, hops, finalUrl: url, html, problem: res.ok ? undefined : "status" };
  }
  return { ok: false, hops, finalUrl: url, html: "", problem: "error" };
}

function scriptedRedirect(html: string, base: URL): URL | null {
  const m =
    html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)/i) ||
    html.match(/(?:window\.|document\.)?location(?:\.href)?\s*=\s*["'](https?:\/\/[^"']+)["']/i) ||
    html.match(/location\.replace\(\s*["'](https?:\/\/[^"']+)["']\s*\)/i);
  if (!m) return null;
  try {
    const u = new URL(m[1], base);
    return ["http:", "https:"].includes(u.protocol) && u.href !== base.href ? u : null;
  } catch {
    return null;
  }
}
