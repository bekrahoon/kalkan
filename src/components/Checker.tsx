"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRightLeft, Car, FileText, Link2, ShoppingBag, Users } from "lucide-react";
import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";
import { LoadingView } from "./LoadingView";
import { ReportView } from "./ReportView";
import { DEMO_IDS, DEMO_TEXTS, getDemoReport } from "@/lib/demo";
import type { AnalyzeMeta, AnalyzeRequest, AnalyzeResponse, DemoId, ErrorCode, Lang, Report } from "@/lib/types";

type Phase = "idle" | "loading" | "report";
const MIN_LOADING_MS = 2600;
const STATIC_DEMO = process.env.NEXT_PUBLIC_KALKAN_STATIC === "1";
const DEMO_ICONS: Record<DemoId, React.ComponentType<{ className?: string }>> = {
  social: Users,
  taxi: Car,
  shop: ShoppingBag,
};

export function Checker() {
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [result, setResult] = useState<{ report: Report; meta: AnalyzeMeta; lang: Lang } | null>(null);
  const lastReq = useRef<Omit<AnalyzeRequest, "lang"> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const run = useCallback(
    async (req: Omit<AnalyzeRequest, "lang">, reqLang: Lang = lang) => {
      lastReq.current = req;
      setError(null);
      setPhase("loading");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      const ctrl = new AbortController();
      abort.current = ctrl;
      const started = Date.now();
      const wait = () => new Promise((r) => setTimeout(r, Math.max(0, MIN_LOADING_MS - (Date.now() - started))));

      let data: AnalyzeResponse;
      if (STATIC_DEMO) {
        // Serverless phone demo: examples come from the bundle, everything else needs the real deploy.
        data = req.demoId
          ? {
              ok: true,
              report: getDemoReport(req.demoId, reqLang),
              meta: { source: "demo-cache", truncated: false, originalChars: 0, analyzedChars: 0, fallbackReason: "static_demo" },
            }
          : { ok: false, error: { code: "static_demo" } };
      } else {
        try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...req, lang: reqLang }),
          signal: ctrl.signal,
        });
        data = (await res.json()) as AnalyzeResponse;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // Server unreachable (offline laptop, broken deploy): demo still works from the bundle.
        data = req.demoId
          ? {
              ok: true,
              report: getDemoReport(req.demoId, reqLang),
              meta: { source: "demo-cache", truncated: false, originalChars: 0, analyzedChars: 0, fallbackReason: "network" },
            }
          : { ok: false, error: { code: "network" } };
        }
      }

      await wait();
      if (ctrl.signal.aborted) return;

      if (data.ok) {
        setResult({ report: data.report, meta: data.meta, lang: reqLang });
        setPhase("report");
      } else {
        setError(data.error.code);
        setPhase("idle");
      }
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
    [lang],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "url") {
      if (!url.trim()) return setError("invalid_url");
      run({ mode: "url", url: url.trim() });
    } else {
      const demoId = DEMO_IDS.find((id) => DEMO_TEXTS[id].trim() === text.trim());
      run({ mode: "text", text, demoId });
    }
  };

  const runDemo = (id: DemoId) => {
    setMode("text");
    setText(DEMO_TEXTS[id]);
    run({ mode: "text", text: DEMO_TEXTS[id], demoId: id });
  };

  const cancel = () => {
    abort.current?.abort();
    setPhase("idle");
  };

  const reset = () => {
    setResult(null);
    setPhase("idle");
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const switchToManual = () => {
    setMode("text");
    setError(null);
  };

  return (
    <div ref={topRef} className="scroll-mt-20">
      {phase === "loading" && <LoadingView onCancel={cancel} />}

      {phase === "report" && result && (
        <ReportView
          report={result.report}
          meta={result.meta}
          reportLang={result.lang}
          onReset={reset}
          onRerun={() => lastReq.current && run(lastReq.current, lang)}
        />
      )}

      {phase === "idle" && (
        <section className="mx-auto max-w-2xl px-4 pb-6 pt-10 sm:pt-16">
          <div className="text-center">
            <ShieldLogo size={52} className="mx-auto" />
            <p className="eyebrow mt-5">{t.hero.kicker}</p>
            <h1 className="mt-2 text-[clamp(2rem,7vw,3rem)] font-bold leading-tight">{t.hero.title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t.hero.subtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="card mt-8 p-4 sm:p-5" noValidate>
            {mode === "url" ? (
              <div>
                <label htmlFor="url" className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Link2 className="h-4 w-4 text-primary" aria-hidden />
                  {t.hero.urlLabel}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.hero.urlPlaceholder}
                    className="field flex-1"
                    aria-describedby={error ? "form-error" : undefined}
                    aria-invalid={error === "invalid_url" || undefined}
                  />
                  <button type="submit" className="btn btn-primary">
                    {t.hero.check}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="policy" className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-primary" aria-hidden />
                  {t.hero.textLabel}
                </label>
                <textarea
                  id="policy"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.hero.textPlaceholder}
                  rows={7}
                  className="field resize-y text-sm leading-relaxed"
                  aria-describedby={error ? "form-error" : "policy-count"}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span id="policy-count" className="text-xs text-muted">
                    {t.hero.chars(text.length)}
                  </span>
                  <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
                    {t.hero.check}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMode(mode === "url" ? "text" : "url");
                setError(null);
              }}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline"
              aria-pressed={mode === "text"}
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden />
              {mode === "url" ? t.hero.toManual : t.hero.toUrl}
            </button>
            {mode === "url" && <p className="text-xs text-muted">{t.hero.manualHint}</p>}
          </form>

          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              id="form-error"
              role="alert"
              className="fade-in mt-4 flex gap-3 rounded-2xl border border-line bg-warn-soft p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold">{t.errors.title}</p>
                <p className="mt-1 text-sm leading-snug">{t.errors[error]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mode === "url" && error !== "invalid_url" && error !== "static_demo" && (
                    <button type="button" onClick={switchToManual} className="btn btn-primary min-h-[40px] px-3 py-1 text-sm">
                      {t.errors.toManual}
                    </button>
                  )}
                  <button type="button" onClick={() => setError(null)} className="btn btn-secondary min-h-[40px] px-3 py-1 text-sm">
                    {t.errors.retry}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <p className="text-center text-sm text-muted">{t.hero.demosTitle}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {DEMO_IDS.map((id) => {
                const Icon = DEMO_ICONS[id];
                return (
                  <button key={id} type="button" onClick={() => runDemo(id)} className="btn btn-secondary justify-start text-sm sm:justify-center">
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    {t.hero.demos[id]}
                  </button>
                );
              })}
            </div>
          </div>

          <ol className="mt-10 grid gap-3 sm:grid-cols-3">
            {t.hero.steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-subtle p-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>

          <p className="mt-6 text-center text-xs text-muted">{t.hero.privacyNote}</p>
        </section>
      )}
    </div>
  );
}
