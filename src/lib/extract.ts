import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";
import { AnalyzeError } from "./gemini";

const MAX_HTML_BYTES = 3_000_000;
/** PDFs go to Gemini as inline data; keep well under its request limit. */
const MAX_PDF_BYTES = 15_000_000;

type Fetched = { kind: "html"; html: string; finalUrl: URL } | { kind: "pdf"; data: string; finalUrl: URL };
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
async function fetchHtml(start: URL): Promise<Fetched> {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(url);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5",
          "Accept-Language": "ru,ky;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (e) {
      const name = (e as Error)?.name;
      console.warn(`[fetch] ${url.hostname}: ${name} ${(e as Error)?.message ?? ""} ${String((e as { cause?: unknown })?.cause ?? "")}`.slice(0, 300));
      throw new AnalyzeError(name === "TimeoutError" ? "fetch_timeout" : "fetch_failed", 502);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      if (!["http:", "https:"].includes(url.protocol)) throw new AnalyzeError("blocked_url", 400);
      continue;
    }
    if (!res.ok) {
      console.warn(`[fetch] ${url.hostname}: HTTP ${res.status}`);
      throw new AnalyzeError("fetch_status", 502);
    }

    const type = res.headers.get("content-type") ?? "";
    const len = Number(res.headers.get("content-length") ?? 0);

    if (/application\/pdf/i.test(type) || (!type && url.pathname.toLowerCase().endsWith(".pdf"))) {
      if (len > MAX_PDF_BYTES) throw new AnalyzeError("file_too_big", 413);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_PDF_BYTES) throw new AnalyzeError("file_too_big", 413);
      return { kind: "pdf", data: buf.toString("base64"), finalUrl: url };
    }

    if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) {
      throw new AnalyzeError("not_html", 415);
    }

    if (len > MAX_HTML_BYTES) throw new AnalyzeError("not_html", 413);
    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8").decode(buf.slice(0, MAX_HTML_BYTES));
    return { kind: "html", html, finalUrl: url };
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

/**
 * Fallback for pages that block simple requests or build their text with JavaScript:
 * Jina Reader (r.jina.ai) opens the page in a real browser and returns its text.
 * Free without a key (rate-limited); set JINA_API_KEY for higher limits, READER_FALLBACK=0 to turn it off.
 */
async function readViaReader(url: URL): Promise<string | null> {
  if (process.env.READER_FALLBACK === "0") return null;
  await assertPublicHost(url);
  try {
    const headers: Record<string, string> = { Accept: "text/plain", "X-Return-Format": "text" };
    if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    const res = await fetch(`https://r.jina.ai/${url.href}`, { headers, signal: AbortSignal.timeout(25_000) });
    if (!res.ok) {
      console.warn(`[reader] ${url.hostname}: HTTP ${res.status}`);
      return null;
    }
    const text = (await res.text()).replace(/\n{3,}/g, "\n\n").trim();
    console.info(`[reader] ${url.hostname}: ${text.length} chars`);
    return text.length >= 400 ? text : null;
  } catch (e) {
    console.warn(`[reader] ${url.hostname}: ${(e as Error)?.name}`);
    return null;
  }
}

export type FetchedPolicy = { text: string; url: string } | { pdf: string; url: string };

export async function fetchPolicyText(input: string): Promise<FetchedPolicy> {
  const url = parseUserUrl(input);
  let first: Fetched;
  try {
    first = await fetchHtml(url);
  } catch (e) {
    // Blocked for bots or timed out → let a real browser try before giving up.
    if (e instanceof AnalyzeError && ["fetch_status", "fetch_timeout", "fetch_failed"].includes(e.code)) {
      const viaReader = await readViaReader(url);
      if (viaReader) return { text: viaReader, url: url.href };
    }
    throw e;
  }
  if (first.kind === "pdf") return { pdf: first.data, url: first.finalUrl.href };

  let text = htmlToText(first.html);
  let used = first.finalUrl;

  // Looks like a homepage rather than a policy → follow its "Privacy" link once (it may be a PDF).
  if (policyScore(text) < 5) {
    const link = findPolicyLink(first.html, first.finalUrl);
    if (link && link.href !== first.finalUrl.href) {
      try {
        const second = await fetchHtml(link);
        if (second.kind === "pdf") return { pdf: second.data, url: second.finalUrl.href };
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

  if (text.length < 400 || policyScore(text) < 2) {
    // Probably rendered by JavaScript: the HTML we got is an empty shell.
    const viaReader = await readViaReader(used);
    if (viaReader && viaReader.length > text.length) return { text: viaReader, url: used.href };
  }
  if (text.length < 400) throw new AnalyzeError("too_little_text", 422);
  return { text, url: used.href };
}
