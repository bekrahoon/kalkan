import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import net from "node:net";
import { Agent } from "undici";

/*
 * SSRF protection for every request to a user-supplied URL.
 *
 * Checking the address before fetch() is not enough: the name can resolve to a public IP during
 * the check and to 127.0.0.1 a moment later (DNS rebinding). So the check runs inside the
 * connection itself: `publicAgent` resolves the name, rejects internal addresses and connects to
 * exactly the address it has just validated.
 */

const V4_BLOCKED: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata (169.254.169.254)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

const V6_BLOCKED: [string, number][] = [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["100::", 64], // discard
  ["2001:db8::", 32], // documentation
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];

const blocked = new net.BlockList();
for (const [a, p] of V4_BLOCKED) blocked.addSubnet(a, p, "ipv4");
for (const [a, p] of V6_BLOCKED) blocked.addSubnet(a, p, "ipv6");

/** Expands an IPv6 address to 8 groups of 16 bits. */
function v6Groups(ip: string): number[] | null {
  let s = ip.toLowerCase().split("%")[0];
  // trailing dotted IPv4 (::ffff:1.2.3.4)
  const m = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (m) {
    const [a, b, c, d] = m[1].split(".").map(Number);
    s = s.slice(0, -m[1].length) + `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined ? (tail ? tail.split(":") : []) : [];
  const fill = s.includes("::") ? 8 - h.length - t.length : 0;
  const groups = [...h, ...Array(fill).fill("0"), ...t].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => g >= 0 && g <= 0xffff) ? groups : null;
}

const v4FromGroups = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

/** True only for addresses on the public internet. */
export function isPublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) return !blocked.check(ip, "ipv4");
  if (!net.isIPv6(ip)) return false;
  const g = v6Groups(ip);
  if (!g) return false;
  // IPv4 hidden inside IPv6: mapped (::ffff:a.b.c.d), compatible (::a.b.c.d), NAT64 (64:ff9b::a.b.c.d)
  const mapped = g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0);
  const nat64 = g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0);
  if ((mapped && (g[6] || g[7])) || nat64) return isPublicIp(v4FromGroups(g[6], g[7]));
  // 6to4 (2002:AABB:CCDD::) embeds an IPv4 address too
  if (g[0] === 0x2002) return isPublicIp(v4FromGroups(g[1], g[2]));
  // Teredo (2001:0::/32) tunnels to arbitrary hosts
  if (g[0] === 0x2001 && g[1] === 0) return false;
  return !blocked.check(ip, "ipv6");
}

export class BlockedAddressError extends Error {
  constructor(host: string) {
    super(`blocked internal address for ${host}`);
    this.name = "BlockedAddressError";
  }
}

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** dns.lookup replacement used by the socket itself: resolves, validates, and returns only public addresses. */
function publicLookup(hostname: string, options: { all?: boolean; family?: number }, cb: LookupCb) {
  dnsLookup(hostname, { all: true, family: options.family ?? 0 }, (err, addresses) => {
    if (err) return cb(err, []);
    const list = addresses as LookupAddress[];
    if (!list.length || list.some((a) => !isPublicIp(a.address))) return cb(new BlockedAddressError(hostname), []);
    if (options.all) cb(null, list);
    else cb(null, list[0].address, list[0].family);
  });
}

/** HTTP agent for user-supplied URLs: every connection goes through publicLookup. */
export const publicAgent = new Agent({
  connect: { lookup: publicLookup as never, timeout: 8_000 },
  headersTimeout: 8_000,
  bodyTimeout: 8_000,
});

/** Reads at most `limit` bytes of a response body and drops the rest (a huge page cannot exhaust memory). */
export async function readLimited(body: ReadableStream<Uint8Array> | null, limit: number): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (size < limit) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      size += value.byteLength;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  const out = new Uint8Array(Math.min(size, limit));
  let off = 0;
  for (const c of chunks) {
    const part = c.subarray(0, Math.min(c.byteLength, out.length - off));
    out.set(part, off);
    off += part.byteLength;
    if (off >= out.length) break;
  }
  return out;
}
