export type Lang = "ru" | "ky";

export type RiskLevel = "low" | "medium" | "high";
export type TriState = "yes" | "no" | "unclear";

export const CATEGORY_IDS = [
  "geolocation",
  "contacts",
  "biometrics",
  "finance",
  "browsing",
  "media",
  "children",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const RIGHT_IDS = [
  "access",
  "rectification",
  "deletion",
  "withdraw_consent",
  "portability",
  "objection",
] as const;
export type RightId = (typeof RIGHT_IDS)[number];

export const RECIPIENT_TYPES = [
  "advertisers",
  "partners",
  "affiliates",
  "processors",
  "government",
  "other",
] as const;
export type RecipientType = (typeof RECIPIENT_TYPES)[number];

export interface DataCategory {
  category: CategoryId;
  collected: TriState;
  details: string;
}

export interface ThirdParty {
  recipient: string;
  type: RecipientType;
  purpose: string;
  cross_border: boolean;
}

export interface Retention {
  period: string;
  can_delete: TriState;
  how_to_delete: string;
}

export interface RedFlag {
  title: string;
  quote: string;
  explanation: string;
  /** Server-side check: the quote really appears in the analysed text. */
  quote_verified?: boolean;
}

export interface UserRight {
  right: RightId;
  available: TriState;
  details: string;
}

export interface Report {
  company_name: string;
  contact_email: string;
  summary: string;
  risk_score: number;
  risk_level: RiskLevel;
  data_categories: DataCategory[];
  other_data: string[];
  third_parties: ThirdParty[];
  retention: Retention;
  red_flags: RedFlag[];
  user_rights: UserRight[];
}

export type ErrorCode =
  | "bad_request"
  | "invalid_url"
  | "blocked_url"
  | "fetch_failed"
  | "fetch_timeout"
  | "fetch_status"
  | "not_html"
  | "too_little_text"
  | "text_too_short"
  | "rate_limit"
  | "too_many_requests"
  | "no_api_key"
  | "ai_failed"
  | "ai_bad_json"
  | "network"
  | "static_demo";

export interface AnalyzeMeta {
  source: "live" | "demo-cache";
  truncated: boolean;
  originalChars: number;
  analyzedChars: number;
  sourceUrl?: string;
  model?: string;
  /** Why we fell back to the cached demo report, if we did. */
  fallbackReason?: ErrorCode;
}

export type AnalyzeResponse =
  | { ok: true; report: Report; meta: AnalyzeMeta }
  | { ok: false; error: { code: ErrorCode; status?: number } };

export interface AnalyzeRequest {
  mode: "url" | "text";
  url?: string;
  text?: string;
  lang: Lang;
  demoId?: DemoId;
}

export type DemoId = "social" | "taxi" | "shop";
