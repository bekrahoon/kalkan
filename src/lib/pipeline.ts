import "server-only";
import { fetchPolicyText } from "./extract";
import { AnalyzeError, analyzeWithGemini, type PolicyInput } from "./gemini";
import { normalizeReport } from "./normalize";
import { getPlayInfo, parsePlayUrl } from "./playstore";
import type { AnalyzeMeta, Lang, PlayInfo, Report } from "./types";

/**
 * ~50–60k tokens. Gemini Flash reads far more, but this keeps one request inside free-tier
 * per-minute limits while covering practically every real privacy policy in full.
 */
const MAX_POLICY_CHARS = 200_000;

/** Cut at a paragraph/sentence boundary near the limit rather than mid-word. */
export function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_POLICY_CHARS) return { text, truncated: false };
  const slice = text.slice(0, MAX_POLICY_CHARS);
  const cut = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
  return { text: cut > MAX_POLICY_CHARS * 0.8 ? slice.slice(0, cut + 1) : slice, truncated: true };
}

export type AnalysisInput =
  | { kind: "url"; url: string }
  | { kind: "text"; text: string }
  | { kind: "file"; mime: string; data: string };

/**
 * The whole job for one policy: get its text (page, PDF, Google Play app or upload),
 * ask Gemini, and clean up the answer. Throws AnalyzeError with a user-facing code.
 */
export async function runAnalysis(
  input: AnalysisInput,
  lang: Lang,
  forChild = false,
): Promise<{ report: Report; meta: AnalyzeMeta }> {
  let policy = "";
  let fileInput: PolicyInput | null = null;
  let sourceUrl: string | undefined;
  let play: PlayInfo | undefined;

  if (input.kind === "url") {
    let policyUrl = input.url;
    // A Google Play link: take Play's own data-safety info + permissions, then read the app's policy.
    const appId = parsePlayUrl(input.url);
    if (appId) {
      play = await getPlayInfo(appId, lang);
      if (!play.privacyPolicyUrl) throw new AnalyzeError("play_no_policy", 422);
      policyUrl = play.privacyPolicyUrl;
    }
    try {
      const fetched = await fetchPolicyText(policyUrl);
      sourceUrl = fetched.url;
      if ("pdf" in fetched) fileInput = { mime: "application/pdf", data: fetched.pdf };
      else policy = fetched.text;
    } catch (e) {
      if (e instanceof AnalyzeError) console.warn(`[analyze] fetch stage: ${e.code}`, policyUrl.slice(0, 200));
      throw e;
    }
  } else if (input.kind === "file") {
    fileInput = { mime: input.mime, data: input.data };
  } else {
    policy = input.text;
  }

  const originalChars = policy.length;
  const { text, truncated } = truncate(policy);
  const { json, model } = await analyzeWithGemini(fileInput ?? { text }, lang, forChild);
  // Quotes can only be checked against text we extracted ourselves, not against a PDF/photo.
  const report = normalizeReport(json, lang, fileInput ? undefined : text);
  return {
    report,
    meta: {
      source: "live",
      truncated: fileInput ? false : truncated,
      originalChars,
      analyzedChars: text.length,
      sourceUrl,
      model,
      play,
    },
  };
}
