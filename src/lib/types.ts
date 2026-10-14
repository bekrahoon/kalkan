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
  /** A concrete step the user can take about this flag. */
  action: string;
  /** Server-side check: the quote really appears in the analysed text. */
  quote_verified?: boolean;
}

/** One line of "why this score": what the policy says and how many points it adds (+) or removes (−). */
export interface RiskFactor {
  factor: string;
  points: number;
}

export interface UserRight {
  right: RightId;
  available: TriState;
  details: string;
}

export const COMPLIANCE_ITEMS = [
  "operator",
  "purposes",
  "data_list",
  "consent",
  "retention",
  "third_parties",
  "cross_border",
  "user_rights",
  "contact",
  "security",
  "children",
  "changes",
] as const;
export type ComplianceItem = (typeof COMPLIANCE_ITEMS)[number];

/** Does the policy contain an element a well-written policy should have? (for business owners) */
export interface ComplianceCheck {
  item: ComplianceItem;
  status: TriState;
  note: string;
}

/** What a parent needs to know about children's data. */
export interface ChildrenCheck {
  min_age: string;
  parental_consent: TriState;
  ads_to_children: TriState;
  summary: string;
}

export interface Report {
  company_name: string;
  contact_email: string;
  summary: string;
  risk_score: number;
  risk_level: RiskLevel;
  /** When present, risk_score = BASE_SCORE + sum(points), clamped to 0–100. */
  risk_factors: RiskFactor[];
  data_categories: DataCategory[];
  other_data: string[];
  third_parties: ThirdParty[];
  retention: Retention;
  red_flags: RedFlag[];
  user_rights: UserRight[];
  children_check: ChildrenCheck;
  compliance: ComplianceCheck[];
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
  | "ai_busy"
  | "ai_bad_json"
  | "network"
  | "static_demo"
  | "file_too_big"
  | "file_type"
  | "play_no_policy";

export interface AnalyzeMeta {
  source: "live" | "demo-cache";
  truncated: boolean;
  originalChars: number;
  analyzedChars: number;
  sourceUrl?: string;
  model?: string;
  /** Served from the server cache instead of a new AI request. */
  cached?: boolean;
  /** Extra facts from Google Play when the link was a Play Store page. */
  play?: PlayInfo;
  /** Why we fell back to the cached demo report, if we did. */
  fallbackReason?: ErrorCode;
}

export interface PlayInfo {
  appId: string;
  title: string;
  developer: string;
  privacyPolicyUrl: string;
  shared: { data: string; purpose: string; type: string }[];
  collected: { data: string; purpose: string; type: string }[];
  security: string[];
  permissions: string[];
  available: boolean;
}

export type AnalyzeResponse =
  | { ok: true; report: Report; meta: AnalyzeMeta }
  | { ok: false; error: { code: ErrorCode; status?: number } };

export interface AnalyzeRequest {
  mode: "url" | "text" | "file";
  url?: string;
  text?: string;
  file?: UploadedFile;
  lang: Lang;
  demoId?: DemoId;
  /** A parent checking an app for their child. */
  forChild?: boolean;
}

/** A PDF or photo of a policy, sent as base64 and read by Gemini directly. */
export interface UploadedFile {
  name: string;
  mime: string;
  data: string;
}

export const FILE_MIMES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"] as const;
/** Raw size limit; base64 adds ~33% and Vercel functions accept bodies up to ~4.5 MB. */
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const BASE_SCORE = 20;

export type DemoId = "social" | "taxi" | "shop";
