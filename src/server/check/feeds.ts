import "server-only";

/**
 * Public lists of known phishing pages.
 * - OpenPhish community feed (free, no key, refreshed every few hours) — cached in memory for an hour.
 * - Google Safe Browsing, only if SAFE_BROWSING_API_KEY is set (free Google Cloud key with the Safe Browsing API enabled).
 */
let openphish: { at: number; urls: Set<string>; hosts: Set<string> } | null = null;

async function loadOpenPhish(): Promise<typeof openphish> {
  if (openphish && Date.now() - openphish.at < 3600_000) return openphish;
  try {
    const r = await fetch("https://openphish.com/feed.txt", { signal: AbortSignal.timeout(4_000) });
    if (!r.ok) return openphish;
    const lines = (await r.text()).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const hosts = new Set<string>();
    for (const l of lines) {
      try {
        hosts.add(new URL(l).hostname.toLowerCase());
      } catch {
        /* skip */
      }
    }
    openphish = { at: Date.now(), urls: new Set(lines.map((l) => l.replace(/\/$/, ""))), hosts };
  } catch {
    /* feed unavailable: just skip this source */
  }
  return openphish;
}

export interface FeedHit {
  source: "openphish" | "google";
}

export async function checkFeeds(urls: URL[], isShared: (host: string) => boolean): Promise<FeedHit | null> {
  const [op, gsb] = await Promise.all([loadOpenPhish(), safeBrowsing(urls)]);
  if (gsb) return { source: "google" };
  if (op) {
    for (const u of urls) {
      // Whole-host match only for hosts that are not shared platforms (a single bad page on a big site is not the site).
      if (op.urls.has(u.href.replace(/\/$/, "")) || (!isShared(u.hostname) && op.hosts.has(u.hostname.toLowerCase()))) return { source: "openphish" };
    }
  }
  return null;
}

async function safeBrowsing(urls: URL[]): Promise<boolean> {
  const key = process.env.SAFE_BROWSING_API_KEY;
  if (!key) return false;
  try {
    const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "kalkan", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: urls.map((u) => ({ url: u.href })),
        },
      }),
      signal: AbortSignal.timeout(4_000),
    });
    if (!r.ok) return false;
    const j = (await r.json()) as { matches?: unknown[] };
    return Boolean(j.matches?.length);
  } catch {
    return false;
  }
}
