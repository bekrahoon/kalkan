"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, FileText, Link2, MessageSquareText, ShoppingBag, Car, Users } from "lucide-react";
import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";
import { LoadingComic } from "./LoadingComic";
import { ReportView } from "./ReportView";
import { DEMO_IDS, DEMO_TEXTS, getDemoReport } from "@/lib/demo";
import type { AnalyzeMeta, AnalyzeRequest, AnalyzeResponse, DemoId, ErrorCode, Lang, Report } from "@/lib/types";

type Phase = "idle" | "loading" | "report";
const MIN_LOADING_MS = 2600;
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
    <div ref={topRef} className="scroll-mt-24">
      {phase === "loading" && <LoadingComic onCancel={cancel} />}

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
        <section className="relative overflow-hidden">
          <div aria-hidden className="speed-lines absolute inset-0" />
          <div aria-hidden className="diag-lines absolute inset-0 opacity-60" />

          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-8 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="caption">{t.hero.kicker}</span>
              <h1
                className="display hero-title glitch slant mt-5 text-[clamp(2.9rem,11vw,5.6rem)]"
                data-text={t.hero.title}
              >
                {t.hero.title.split(" ").map((w, i, a) => (
                  <span key={i} className={i === a.length - 1 ? "hl" : undefined}>
                    {w}
                    {i < a.length - 1 ? " " : ""}
                  </span>
                ))}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-fg/90 sm:text-lg">{t.hero.subtitle}</p>

              <form onSubmit={onSubmit} className="panel panel-halftone tilt-l mt-7 p-4 sm:p-5" noValidate>
                {mode === "url" ? (
                  <div>
                    <label htmlFor="url" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Link2 className="h-4 w-4 text-teal" aria-hidden />
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
                      <button type="submit" className="btn btn-primary text-lg">
                        {t.hero.check}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="policy" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <FileText className="h-4 w-4 text-teal" aria-hidden />
                      {t.hero.textLabel}
                    </label>
                    <textarea
                      id="policy"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t.hero.textPlaceholder}
                      rows={7}
                      className="field resize-y font-mono text-sm leading-relaxed"
                      aria-describedby={error ? "form-error" : "policy-count"}
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span id="policy-count" className="text-xs text-muted">
                        {t.hero.chars(text.length)}
                      </span>
                      <button type="submit" className="btn btn-primary text-lg" disabled={!text.trim()}>
                        {t.hero.check}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-dashed border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "url" ? "text" : "url");
                      setError(null);
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-teal underline decoration-2 underline-offset-4 hover:text-amber"
                    aria-pressed={mode === "text"}
                  >
                    <MessageSquareText className="h-4 w-4" aria-hidden />
                    {mode === "url" ? t.hero.toManual : t.hero.toUrl}
                  </button>
                  {mode === "url" && <span className="text-xs text-muted">{t.hero.manualHint}</span>}
                </div>
              </form>

              {error && (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  id="form-error"
                  role="alert"
                  className="bubble bubble-up mt-8 max-w-xl pop-in"
                >
                  <p className="display flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-[#b4001a]" aria-hidden />
                    {t.errors.title}
                  </p>
                  <p className="mt-1 text-[15px] leading-snug">{t.errors[error]}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mode === "url" && error !== "invalid_url" && (
                      <button type="button" onClick={switchToManual} className="btn btn-amber min-h-[40px] px-3 py-1 text-sm">
                        {t.errors.toManual}
                      </button>
                    )}
                    <button type="button" onClick={() => setError(null)} className="btn btn-ghost min-h-[40px] px-3 py-1 text-sm">
                      {t.errors.retry}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <p className="text-sm font-semibold text-muted">{t.hero.demosTitle}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {DEMO_IDS.map((id) => {
                    const Icon = DEMO_ICONS[id];
                    return (
                      <button key={id} type="button" onClick={() => runDemo(id)} className="btn btn-ghost min-h-[44px] px-3 text-sm">
                        <Icon className="h-4 w-4 text-amber" aria-hidden />
                        {t.hero.demos[id]}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-muted">{t.hero.privacyNote}</p>
              </div>
            </div>

            <HeroArt />
          </div>
        </section>
      )}
    </div>
  );
}

function HeroArt() {
  const { t } = useLang();
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="panel tilt-r overflow-hidden p-0">
        <div
          aria-hidden
          className="relative flex aspect-[4/4.3] items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#123a44_0%,#0b0f1a_65%)]"
        >
          <div className="speed-lines absolute inset-0 [mask-image:none] opacity-80" style={{ backgroundPosition: "center" }} />
          {/* data streams aimed at the shield */}
          <svg viewBox="0 0 300 320" className="absolute inset-0 h-full w-full">
            {[
              [0, 40, "#FFB627"],
              [0, 160, "#FF4458"],
              [0, 280, "#FFB627"],
              [300, 60, "#FFB627"],
              [300, 250, "#FF4458"],
            ].map(([x, y, c], i) => (
              <g key={i}>
                <path
                  d={`M${x} ${y} L150 160`}
                  stroke={c as string}
                  strokeWidth="2"
                  strokeDasharray="4 7"
                  opacity="0.6"
                />
                <circle cx={x as number} cy={y as number} r="0" fill={c as string} />
              </g>
            ))}
          </svg>
          <ShieldLogo size={190} animated className="relative drop-shadow-[0_0_30px_rgba(0,229,212,0.35)]" />
        </div>
        <ol className="flex border-t-[3px] border-black">
          {t.hero.steps.map((s, i) => (
            <li key={i} className={`flex-1 p-3 text-xs font-semibold leading-tight ${i ? "border-l-[3px] border-black" : ""}`}>
              <span className="display mb-1 block text-2xl text-teal">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <div aria-hidden className="absolute -top-4 left-2 sm:-left-6">
        <span className="caption caption-teal">{t.loading.title}</span>
      </div>
    </div>
  );
}
