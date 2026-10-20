export type Lang = "ru" | "ky" | "en";
export const LANGS = ["ru", "ky", "en"] as const;
export function toLang(v: unknown): Lang {
  return v === "ky" || v === "en" ? v : "ru";
}

/** Final answer for the user. "unknown" = not enough facts to say anything either way. */
export type Verdict = "danger" | "suspicious" | "safe" | "unknown";
export const VERDICT_RANK: Record<Verdict, number> = { safe: 0, unknown: 1, suspicious: 2, danger: 3 };
export const VERDICTS = ["danger", "suspicious", "safe", "unknown"] as const;

export type CheckKind = "link" | "message" | "app" | "phone" | "document" | "company";

/** What the user asked to check: anything (auto-detected) or a company / organisation. */
export type CheckMode = "auto" | "company";

/** One reason behind the verdict. bad = clear sign of fraud, warn = be careful, good = reassuring fact. */
export type SignalLevel = "bad" | "warn" | "good" | "info";
export interface Signal {
  level: SignalLevel;
  text: string;
}

/** Common fraud schemes; each has an explainer on the /schemes page. */
export const SCHEME_IDS = [
  "fake_bank",
  "relative",
  "voting",
  "sms_code",
  "prize",
  "investment",
  "job",
  "marketplace",
  "fake_gov",
  "loan",
  "fake_shop",
  "phishing",
  "deepfake",
] as const;
export type SchemeId = (typeof SCHEME_IDS)[number];

/** Something users can report as fraud. Values are normalised (domain = registrable domain, phone = +996…). */
export interface Indicator {
  type: "domain" | "app";
  value: string;
  /** Safe to show (phones are masked). */
  display: string;
}

export interface Fact {
  label: string;
  value: string;
}

export interface CheckResult {
  kind: CheckKind;
  verdict: Verdict;
  /** Short headline: "Поддельный сайт MBank". */
  title: string;
  summary: string;
  /** What was checked: domain, app name, "Сообщение"… */
  subject: string;
  scheme: SchemeId | null;
  signals: Signal[];
  advice: string[];
  facts: Fact[];
  indicators: Indicator[];
  /** How many times KalkanCheck users reported the main indicator(s). */
  reports: number;
  /** Links found inside a message, each checked on its own. */
  links: CheckResult[];
  lang: Lang;
  /** Prepared example, not a live check. */
  demo?: boolean;
  /** The AI part failed, the verdict is based on technical checks only. */
  aiSkipped?: boolean;
  /** Documents and companies: how to verify officially (we never confirm authenticity ourselves). */
  verify?: string;
}

export type ErrorCode =
  | "bad_request"
  | "empty"
  | "invalid_url"
  | "blocked_url"
  | "too_many_requests"
  | "no_api_key"
  | "ai_failed"
  | "ai_busy"
  | "rate_limit"
  | "ai_bad_json"
  | "network"
  | "static_demo"
  | "file_too_big"
  | "file_type";

export type CheckResponse = { ok: true; result: CheckResult } | { ok: false; error: { code: ErrorCode; status?: number } };

export interface CheckRequest {
  text?: string;
  mode?: CheckMode;
  image?: UploadedImage;
  lang: Lang;
  demoId?: DemoId;
}

export interface UploadedImage {
  name: string;
  mime: string;
  data: string;
}

export const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif", "application/pdf"] as const;
/** Raw size limit; base64 adds ~33% and Vercel functions accept bodies up to ~4.5 MB. */
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const MAX_TEXT_CHARS = 6000;

export type DemoId = "bank" | "voting" | "fine" | "company" | "real";
