import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { get, put } from "@vercel/blob";
import type { Lang } from "./types";

/*
 * Phones running the Android guard app ("KalkanCheck Защитник").
 * Each phone registers once and gets an id + secret; only a hash of the secret is stored.
 * The phone's trusted people live in the same family store under the owner key "d_<id>".
 */

export interface Device {
  name: string;
  lang: Lang;
  secretHash: string;
  created: string;
}

const enabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const memory = new Map<string, Device>();
const cache = new Map<string, { at: number; d: Device }>();
const path = (id: string) => `devices/${id}.json`;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export const deviceOwner = (id: string) => `d_${id}`;
export const validId = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{16}$/.test(id);

async function save(id: string, d: Device) {
  cache.set(id, { at: Date.now(), d });
  if (!enabled()) {
    memory.set(id, d);
    return;
  }
  await put(path(id), JSON.stringify(d), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
}

async function load(id: string): Promise<Device | null> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.d;
  if (!enabled()) return memory.get(id) ?? null;
  try {
    const r = await get(path(id), { access: "private", useCache: false });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    const d = JSON.parse(await new Response(r.stream).text()) as Device;
    cache.set(id, { at: Date.now(), d });
    if (cache.size > 5_000) cache.clear();
    return d;
  } catch (e) {
    console.warn("[devices] read", (e as Error).message);
    return null;
  }
}

export async function registerDevice(name: string, lang: Lang): Promise<{ id: string; secret: string }> {
  const id = randomBytes(8).toString("hex");
  const secret = randomBytes(24).toString("base64url");
  await save(id, { name, lang, secretHash: hash(secret), created: new Date().toISOString() });
  return { id, secret };
}

export async function authDevice(id: unknown, secret: unknown): Promise<(Device & { id: string }) | null> {
  if (!validId(id) || typeof secret !== "string" || secret.length > 100) return null;
  const d = await load(id);
  if (!d) return null;
  const a = Buffer.from(d.secretHash);
  const b = Buffer.from(hash(secret));
  return a.length === b.length && timingSafeEqual(a, b) ? { ...d, id } : null;
}

export async function updateDevice(id: string, patch: Partial<Pick<Device, "name" | "lang">>) {
  const d = await load(id);
  if (d) await save(id, { ...d, ...patch });
}
