/*
 * Accuracy check for the link engine (technical checks only, no AI).
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/eval/eval-links.mts > eval.json
 * Phishing: fresh links from OpenPhish and Phishing Army. Legit: scripts/eval/eval-legit.txt.
 * Each phishing link is checked twice: with the phishing lists (as on the site) and without them
 * (only Kalkan's own checks), so the second number is not inflated by the lists themselves.
 */
import { readFileSync } from "node:fs";
import { checkLink } from "../../src/server/check/link";
import type { Verdict } from "../../src/lib/types";

const N = Number(process.env.EVAL_N || 100);
const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

async function list(url: string): Promise<string[]> {
  const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  return (await r.text())
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => (/^https?:\/\//.test(l) ? l : `https://${l}`));
}

const openphish = shuffle(await list("https://openphish.com/feed.txt")).slice(0, N / 2);
const phishdb = shuffle(await list("https://phishing.army/download/phishing_army_blocklist.txt")).slice(0, N / 2);
const legit = [...new Set(readFileSync(new URL("./eval-legit.txt", import.meta.url), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")))];

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
    }
  }));
  return out;
}

type Row = { url: string; source: string; withLists: Verdict | "error"; ownOnly: Verdict | "error"; reasons: string[] };
async function run(url: string, source: string, both: boolean): Promise<Row> {
  const one = async (feeds: boolean) => {
    try {
      return await checkLink(url, "ru", { ai: false, feeds });
    } catch {
      return null;
    }
  };
  const a = await one(true);
  const b = both ? await one(false) : a;
  return {
    url,
    source,
    withLists: a?.verdict ?? "error",
    ownOnly: b?.verdict ?? "error",
    reasons: (b ?? a)?.signals.filter((s) => s.level === "bad" || s.level === "warn").map((s) => s.text) ?? [],
  };
}

const phishRows = await pool([...openphish.map((u) => [u, "openphish"]), ...phishdb.map((u) => [u, "phishing.army"])] as [string, string][], 8, ([u, s]) => run(u, s, true));
const legitRows = await pool(legit, 8, (u) => run(u, "legit", false));

const share = (rows: Row[], key: "withLists" | "ownOnly", vs: Verdict[]) => rows.filter((r) => vs.includes(r[key] as Verdict)).length;
const P = phishRows.length;
const L = legitRows.length;
const summary = {
  date: new Date().toISOString().slice(0, 10),
  phishing: P,
  legit: L,
  phishDangerWithLists: share(phishRows, "withLists", ["danger"]),
  phishWarnedWithLists: share(phishRows, "withLists", ["danger", "suspicious"]),
  phishDangerOwnOnly: share(phishRows, "ownOnly", ["danger"]),
  phishWarnedOwnOnly: share(phishRows, "ownOnly", ["danger", "suspicious"]),
  phishUnreachable: phishRows.filter((r) => r.reasons.some((x) => x.includes("не открывается"))).length,
  legitDanger: share(legitRows, "withLists", ["danger"]),
  legitSuspicious: share(legitRows, "withLists", ["suspicious"]),
  legitSafe: share(legitRows, "withLists", ["safe"]),
  legitUnknown: share(legitRows, "withLists", ["unknown"]),
};
console.log(JSON.stringify({ summary, phishRows, legitRows }, null, 1));
