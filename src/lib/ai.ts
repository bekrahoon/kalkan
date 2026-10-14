import "server-only";
import type { ErrorCode } from "./types";

/** Current GA Flash model at the time of writing; override with GEMINI_MODEL if Google renames it. */
export const DEFAULT_MODEL = "gemini-3.8-flash";

/** Tried in order when the main model is overloaded. Override with GEMINI_FALLBACK_MODELS (comma-separated). */
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.6-flash,gemini-3.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export class CheckError extends Error {
  constructor(
    public code: ErrorCode,
    public status = 500,
  ) {
    super(code);
  }
}

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * One structured-output call to Gemini with retries and fallback models.
 * `budgetMs` caps the whole thing: a scam check must answer in seconds, not minutes.
 */
export async function generateJson<T = unknown>(
  system: string,
  parts: GeminiPart[],
  schema: object,
  budgetMs = 40_000,
): Promise<{ json: T; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new CheckError("no_api_key", 503);
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: schema,
      thinkingConfig: { thinkingLevel: "low" },
    },
  };
  let withThinkingConfig = true;

  const models = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
  const deadline = Date.now() + budgetMs;
  let res: Response | null = null;
  let usedModel = model;
  let lastStatus = 0;

  outer: for (const m of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 3_000) break outer;
      try {
        const r = await fetch(
          `${(process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com").replace(/\/$/, "")}/v1beta/models/${encodeURIComponent(m)}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify(
              withThinkingConfig ? body : { ...body, generationConfig: { ...body.generationConfig, thinkingConfig: undefined } },
            ),
            signal: AbortSignal.timeout(Math.min(left, 30_000)),
          },
        );
        if (r.ok) {
          res = r;
          usedModel = m;
          break outer;
        }
        lastStatus = r.status;
        const detail = await r.text().catch(() => "");
        console.error(`[gemini] ${m} HTTP ${r.status}`, detail.slice(0, 300));
        if (r.status === 401 || r.status === 403 || /API key/i.test(detail)) throw new CheckError("no_api_key", 503);
        if (r.status === 400 && withThinkingConfig && /thinking/i.test(detail)) {
          withThinkingConfig = false;
          attempt--;
          continue;
        }
        if (r.status === 404) continue outer;
        if (r.status !== 503 && r.status !== 429 && r.status !== 500) throw new CheckError("ai_failed", 502);
        if (attempt === 0) await new Promise((ok) => setTimeout(ok, 1_000));
      } catch (e) {
        if (e instanceof CheckError) throw e;
        console.error(`[gemini] ${m} ${(e as Error)?.name === "TimeoutError" ? "timeout" : "network error"}`);
        lastStatus = 0;
        continue outer;
      }
    }
  }

  if (!res) {
    if (lastStatus === 429) throw new CheckError("rate_limit", 429);
    if (lastStatus === 503 || lastStatus === 500) throw new CheckError("ai_busy", 503);
    throw new CheckError("ai_failed", 502);
  }

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new CheckError("ai_failed", 502);
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
    return { json: JSON.parse(cleaned) as T, model: usedModel };
  } catch {
    console.error("[gemini] bad JSON", text.slice(0, 300));
    throw new CheckError("ai_bad_json", 502);
  }
}
