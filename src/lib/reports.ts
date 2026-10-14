import "server-only";
import { createHash } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import type { Indicator } from "./types";

/*
 * Community reports: "this link / number / app is fraud".
 * One small private JSON per indicator in Vercel Blob. Phones are stored only as a hash plus a masked form.
 * Without BLOB_READ_WRITE_TOKEN everything still works, just without reports.
 */

interface Stored {
  type: Indicator["type"];
  display: string;
  count: number;
  first: string;
  last: string;
}

const enabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const pathFor = (i: Indicator) =>
  `reports/${i.type}/${createHash("sha256").update(`${i.type}:${i.value}`).digest("hex").slice(0, 40)}.json`;

const cache = new Map<string, { at: number; count: number }>();
const CACHE_MS = 2 * 60_000;

async function read(path: string): Promise<{ data: Stored | null; etag?: string }> {
  const r = await get(path, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return { data: null };
  const text = await new Response(r.stream).text();
  try {
    return { data: JSON.parse(text) as Stored, etag: r.blob.etag };
  } catch {
    return { data: null, etag: r.blob.etag };
  }
}

/** Sum of reports for the given indicators (cached for a couple of minutes). */
export async function reportCount(indicators: Indicator[]): Promise<number> {
  if (!enabled() || indicators.length === 0) return 0;
  const counts = await Promise.all(
    indicators.slice(0, 4).map(async (i) => {
      const path = pathFor(i);
      const hit = cache.get(path);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.count;
      try {
        const { data } = await read(path);
        const count = data?.count ?? 0;
        cache.set(path, { at: Date.now(), count });
        if (cache.size > 10_000) cache.clear();
        return count;
      } catch (e) {
        console.warn("[reports] read", (e as Error).message);
        return 0;
      }
    }),
  );
  return counts.reduce((a, b) => a + b, 0);
}

/** Adds one report; retries on a concurrent write so counts are not lost. */
export async function addReport(i: Indicator): Promise<number | null> {
  if (!enabled()) return null;
  const path = pathFor(i);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, etag } = await read(path);
      const now = new Date().toISOString();
      const next: Stored = data
        ? { ...data, count: data.count + 1, last: now }
        : { type: i.type, display: i.display, count: 1, first: now, last: now };
      await put(path, JSON.stringify(next), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        ...(etag ? { ifMatch: etag } : {}),
      });
      cache.set(path, { at: Date.now(), count: next.count });
      return next.count;
    } catch (e) {
      console.warn("[reports] write", (e as Error).message);
    }
  }
  return null;
}

/** Moderation: removes all reports for an indicator (false or malicious reports). */
export async function clearReports(i: Indicator): Promise<boolean> {
  if (!enabled()) return false;
  const path = pathFor(i);
  try {
    await del(path);
    cache.delete(path);
    return true;
  } catch (e) {
    console.warn("[reports] delete", (e as Error).message);
    return false;
  }
}
