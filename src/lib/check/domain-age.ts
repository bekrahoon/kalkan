import "server-only";
import net from "node:net";

/**
 * When was the domain registered? Fresh domains (days or weeks old) are typical for phishing.
 * RDAP first (structured, most zones), then plain WHOIS on port 43 for zones without RDAP (.kg among them).
 */
export interface DomainAge {
  created: Date;
  registrar?: string;
}

const cache = new Map<string, { at: number; v: DomainAge | null }>();

export async function domainAge(domain: string, budgetMs = 5_000): Promise<DomainAge | null> {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < 12 * 3600_000) return hit.v;
  const deadline = Date.now() + budgetMs;
  let v = await viaRdap(domain, budgetMs).catch(() => null);
  if (!v && Date.now() < deadline - 500) v = await viaWhois(domain, deadline - Date.now()).catch(() => null);
  cache.set(domain, { at: Date.now(), v });
  if (cache.size > 5_000) cache.clear();
  return v;
}

async function viaRdap(domain: string, budgetMs: number): Promise<DomainAge | null> {
  const r = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { Accept: "application/rdap+json, application/json" },
    signal: AbortSignal.timeout(Math.min(budgetMs, 4_000)),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as {
    events?: { eventAction?: string; eventDate?: string }[];
    entities?: { roles?: string[]; vcardArray?: [string, [string, unknown, string, string][]] }[];
  };
  const reg = j.events?.find((e) => e.eventAction === "registration")?.eventDate;
  if (!reg) return null;
  const created = new Date(reg);
  if (Number.isNaN(created.getTime())) return null;
  const registrar = j.entities
    ?.find((e) => e.roles?.includes("registrar"))
    ?.vcardArray?.[1]?.find((f) => f[0] === "fn")?.[3];
  return { created, registrar: typeof registrar === "string" ? registrar : undefined };
}

/** WHOIS servers for zones that have no RDAP yet. */
const WHOIS: Record<string, string> = { kg: "whois.kg", kz: "whois.nic.kz", ru: "whois.tcinet.ru", su: "whois.tcinet.ru", uz: "whois.cctld.uz" };

function whoisQuery(server: string, query: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: server, port: 43 });
    let data = "";
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error("timeout"));
    }, timeoutMs);
    sock.on("connect", () => sock.write(`${query}\r\n`));
    sock.on("data", (d) => {
      data += d.toString("utf8");
      if (data.length > 50_000) sock.destroy();
    });
    sock.on("close", () => {
      clearTimeout(timer);
      resolve(data);
    });
    sock.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

async function viaWhois(domain: string, budgetMs: number): Promise<DomainAge | null> {
  const tld = domain.split(".").pop() ?? "";
  const server = WHOIS[tld];
  if (!server) return null;
  const text = await whoisQuery(server, domain, Math.min(budgetMs, 4_000));
  const m = text.match(/^\s*(?:record created|created(?: on)?|creation date|registered(?: on)?|registration date|domain created)\s*[:.]+\s*(.+)$/im);
  if (!m) return null;
  const created = parseWhoisDate(m[1].trim());
  if (!created) return null;
  const reg = text.match(/^\s*registrar\s*:\s*(.+)$/im)?.[1]?.trim();
  return { created, registrar: reg };
}

function parseWhoisDate(s: string): Date | null {
  const direct = new Date(s);
  if (!Number.isNaN(direct.getTime()) && /\d{4}/.test(s)) return direct;
  // 05.03.2014 or 2014.03.05
  let m = s.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  m = s.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return null;
}
