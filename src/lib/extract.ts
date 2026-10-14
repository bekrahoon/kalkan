import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";
import { AnalyzeError } from "./gemini";

const MAX_HTML_BYTES = 3_000_000;
const FETCH_TIMEOUT_MS = 12_000;
const UA =
  "Mozilla/5.0 (compatible; KalkanPrivacyBot/1.0; +https://github.com/) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const POLICY_WORDS =
  /(конфиденциальн|персональн|privacy|personal data|personal information|cookie|купуялык|жеке маалымат)/gi;
const POLICY_LINK =
  /(privacy|конфиденциальн|персональн|купуялык|datenschutz|politika|policy)/i;

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
    throw new AnalyzeError("invalid_url", 400);
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
    throw new AnalyzeError("invalid_url", 400);
  }
  if (url.username || url.password) throw new AnalyzeError("blocked_url", 400);
  return url;
}

async function assertPublicHost(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^localhost$|\.local$|\.internal$/i.test(host)) throw new AnalyzeError("blocked_url", 400);
  let addrs: { address: string }[];
  try {
    addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  } catch {
    throw new AnalyzeError("fetch_failed", 502);
  }
  if (addrs.some((a) => isPrivateIp(a.address))) throw new AnalyzeError("blocked_url", 400);
}

/** Fetches a page server-side (no CORS issues), following redirects manually so each hop is checked. */
async function fetchHtml(start: URL): Promise<{ html: string; finalUrl: URL }> {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(url);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
          "Accept-Language": "ru,ky;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (e) {
      const name = (e as Error)?.name;
      throw new AnalyzeError(name === "TimeoutError" ? "fetch_timeout" : "fetch_failed", 502);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      if (!["http:", "https:"].includes(url.protocol)) throw new AnalyzeError("blocked_url", 400);
      continue;
    }
    if (!res.ok) throw new AnalyzeError("fetch_status", 502);

    const type = res.headers.get("content-type") ?? "";
    if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) {
      throw new AnalyzeError("not_html", 415);
    }

    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_HTML_BYTES) throw new AnalyzeError("not_html", 413);
    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8").decode(buf.slice(0, MAX_HTML_BYTES));
    return { html, finalUrl: url };
  }
  throw new AnalyzeError("fetch_failed", 502);
}

/** Pulls readable text out of HTML, keeping paragraph breaks. */
export function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, template, form, button, nav, header, footer, aside, [aria-hidden=true], [role=navigation], [role=banner]").remove();
  $("[class*='cookie' i], [id*='cookie' i], [class*='banner' i], [class*='menu' i]").remove();

  const candidates = ["main", "article", "[role=main]", "#content", ".content", "body"];
  let root: ReturnType<typeof $> = $("body");
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 500) {
      root = el;
      break;
    }
  }

  root.find("br").replaceWith("\n");
  root.find("p, div, li, h1, h2, h3, h4, h5, h6, tr, section, dd, dt").each((_, el) => {
    $(el).append("\n");
  });

  return root
    .text()
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

function policyScore(text: string): number {
  return (text.match(POLICY_WORDS) ?? []).length;
}

/** Finds a privacy-policy link on a homepage, if the user pasted the site itself. */
function findPolicyLink(html: string, base: URL): URL | null {
  const $ = cheerio.load(html);
  let best: URL | null = null;
  $("a[href]").each((_, a) => {
    if (best) return;
    const href = $(a).attr("href") ?? "";
    const label = `${$(a).text()} ${href}`;
    if (!POLICY_LINK.test(label)) return;
    try {
      const u = new URL(href, base);
      if (u.protocol.startsWith("http")) best = u;
    } catch {
      /* ignore broken links */
    }
  });
  return best;
}

export async function fetchPolicyText(input: string): Promise<{ text: string; url: string }> {
  const url = parseUserUrl(input);
  const { html, finalUrl } = await fetchHtml(url);
  let text = htmlToText(html);
  let used = finalUrl;

  // Looks like a homepage rather than a policy → follow its "Privacy" link once.
  if (policyScore(text) < 5) {
    const link = findPolicyLink(html, finalUrl);
    if (link && link.href !== finalUrl.href) {
      try {
        const second = await fetchHtml(link);
        const t2 = htmlToText(second.html);
        if (policyScore(t2) > policyScore(text)) {
          text = t2;
          used = second.finalUrl;
        }
      } catch {
        /* keep the first page */
      }
    }
  }

  if (text.length < 400) throw new AnalyzeError("too_little_text", 422);
  return { text, url: used.href };
}
