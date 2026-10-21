"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Building2, ChevronDown, ChevronRight, ClipboardPaste, FileText, HeartHandshake, Link2, MessageSquareText, Paperclip, Smartphone, X } from "lucide-react";
import { InstallCard } from "./PwaSetup";
import { readConsentNow, setConsent } from "./Consent";
import { useLang } from "./LangProvider";
import { ShieldLogo } from "./ShieldLogo";
import { LoadingView } from "./LoadingView";
import { VerdictView } from "./VerdictView";
import { HistoryPanel } from "./HistoryPanel";
import { addToHistory, type HistoryItem } from "@/lib/history";
import { DEMO_IDS, DEMO_INPUTS, getDemoResult } from "@/lib/demo";
import { MAX_FILE_BYTES, type CheckMode, type CheckResponse, type CheckResult, type DemoId, type ErrorCode, type Lang, type UploadedImage } from "@/lib/types";

type Phase = "idle" | "loading" | "result";
type Req = { text?: string; image?: UploadedImage; demoId?: DemoId; mode?: CheckMode };

const MIN_LOADING_MS = 1400;
const STATIC_DEMO = process.env.NEXT_PUBLIC_KALKAN_STATIC === "1";
const WHAT_ICONS = [Link2, MessageSquareText, FileText, Smartphone, Building2];
const MODES: CheckMode[] = ["auto", "company"];

function readAsDataUrl(f: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

/** Screenshots are often large PNGs: shrink to a JPEG the server and the AI read just as well. */
async function prepareImage(f: File): Promise<UploadedImage | "file_type" | "file_too_big"> {
  const mime = (f.type || "").toLowerCase() || (/\.(heic|heif)$/i.test(f.name) ? "image/heic" : "");
  if (mime === "application/pdf" || /\.pdf$/i.test(f.name)) {
    if (f.size > MAX_FILE_BYTES) return "file_too_big";
    const url = await readAsDataUrl(f);
    return { name: f.name || "document.pdf", mime: "application/pdf", data: url.replace(/^data:[^,]*,/, "") };
  }
  if (!mime.startsWith("image/")) return "file_type";
  try {
    const bmp = await createImageBitmap(f);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    if (blob) {
      const url = await readAsDataUrl(blob);
      return { name: f.name || "screenshot.jpg", mime: "image/jpeg", data: url.replace(/^data:[^,]*,/, "") };
    }
  } catch {
    /* the browser can't decode it (e.g. HEIC outside Safari) → send as is */
  }
  if (f.size > MAX_FILE_BYTES) return "file_too_big";
  const url = await readAsDataUrl(f);
  return { name: f.name || "screenshot", mime, data: url.replace(/^data:[^,]*,/, "") };
}

export function Checker() {
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [result, setResult] = useState<{ result: CheckResult; req: Req; at: number } | null>(null);
  const [mode, setMode] = useState<CheckMode>("auto");
  const [canPaste, setCanPaste] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    const id = setTimeout(() => setCanPaste(Boolean(navigator.clipboard?.readText)), 0);
    return () => clearTimeout(id);
  }, []);

  const run = useCallback(
    async (req: Req, reqLang: Lang = lang) => {
      if (readConsentNow() !== "yes") {
        setConsent("unknown");
        return;
      }
      setError(null);
      setPhase("loading");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const ctrl = new AbortController();
      abort.current = ctrl;
      const started = Date.now();

      let data: CheckResponse;
      if (req.demoId) {
        data = { ok: true, result: getDemoResult(req.demoId, reqLang) };
      } else if (STATIC_DEMO) {
        data = { ok: false, error: { code: "static_demo" } };
      } else {
        try {
          const res = await fetch("/api/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: req.text, image: req.image, lang: reqLang, mode: req.mode ?? "auto" }),
            signal: ctrl.signal,
          });
          data = (await res.json()) as CheckResponse;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
          data = { ok: false, error: { code: "network" } };
        }
      }
      await new Promise((r) => setTimeout(r, Math.max(0, MIN_LOADING_MS - (Date.now() - started))));
      if (ctrl.signal.aborted) return;

      if (data.ok) {
        const at = Date.now();
        setResult({ result: data.result, req, at });
        const r = data.result;
        const label = r.kind === "message" && req.text ? `${req.text.slice(0, 48)}${req.text.length > 48 ? "…" : ""}` : r.subject;
        addToHistory({
          lang: reqLang,
          label,
          result: r,
          example: Boolean(req.demoId),
          request: req.image ? undefined : { text: req.text, demoId: req.demoId, mode: req.mode },
        });
        setPhase("result");
      } else {
        setError(data.error.code);
        setPhase("idle");
      }
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
    [lang],
  );

  // Opened via "Share → KalkanCheck" (/share redirects here with ?check=<link> or ?text=<message>).
  const sharedHandled = useRef(false);
  useEffect(() => {
    if (sharedHandled.current) return;
    sharedHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("check") || params.get("text");
    if (!shared) return;
    window.history.replaceState(null, "", window.location.pathname);
    const id = setTimeout(() => {
      setText(shared);
      run({ text: shared });
    }, 0);
    return () => clearTimeout(id);
  }, [run]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v && !image) return setError("empty");
    const demoId = !image ? DEMO_IDS.find((id) => DEMO_INPUTS[id] === v) : undefined;
    if (demoId) return run({ demoId, text: v, mode: demoId === "company" ? "company" : "auto" });
    if (mode === "company") return run({ text: v || undefined, mode });
    run({ text: v || undefined, image: image ?? undefined });
  };

  const attach = async (f: File | undefined | null) => {
    if (!f) return;
    const r = await prepareImage(f);
    if (typeof r === "string") return setError(r);
    setError(null);
    setImage(r);
  };

  const paste = async () => {
    try {
      const v = await navigator.clipboard.readText();
      if (v) setText(v);
    } catch {
      /* permission denied: the user can long-press and paste */
    }
  };

  const reset = () => {
    setResult(null);
    setPhase("idle");
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const openHistory = (h: HistoryItem) => {
    setResult({ result: h.result, req: h.request ?? {}, at: h.at });
    setPhase("result");
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div ref={topRef} className="scroll-mt-20">
      {phase === "loading" && (
        <LoadingView
          onCancel={() => {
            abort.current?.abort();
            setPhase("idle");
          }}
        />
      )}

      {phase === "result" && result && (
        <VerdictView
          result={result.result}
          input={{ text: result.req.text, file: Boolean(result.req.image) || (!result.req.text && result.result.kind === "document") }}
          checkedAt={result.at}
          onReset={reset}
          onRerun={result.req.text || result.req.demoId ? () => run(result.req, lang) : undefined}
        />
      )}

      {phase === "idle" && (
        <section className="mx-auto max-w-2xl px-4 pb-6 pt-6 sm:pt-14">
          <div className="text-center">
            <ShieldLogo size={52} className="mx-auto hidden sm:block" />
            <p className="eyebrow sm:mt-4">{t.hero.kicker}</p>
            <h1 className="mt-2 text-[clamp(2rem,7.5vw,3rem)] font-bold leading-tight">{t.hero.title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t.hero.subtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="card mt-7 p-4 sm:p-5" noValidate>
            <div role="radiogroup" aria-label={t.hero.modesLabel} className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1">
              {MODES.map((m) => {
                const Icon = m === "company" ? Building2 : MessageSquareText;
                const on = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors ${
                      on ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{t.hero.modes[m]}</span>
                  </button>
                );
              })}
            </div>
            <label htmlFor="check-input" className="sr-only">
              {mode === "company" ? t.hero.modes.company : t.hero.label}
            </label>
            <textarea
              id="check-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => {
                const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
                if (f) {
                  e.preventDefault();
                  attach(f);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(e);
              }}
              placeholder={mode === "company" ? t.hero.companyPlaceholder : t.hero.placeholder}
              rows={4}
              spellCheck={false}
              className="field resize-y text-base leading-relaxed"
              aria-describedby={error ? "form-error" : undefined}
            />

            {mode === "company" && <p className="mt-2 text-sm leading-snug text-muted">{t.hero.companyHint}</p>}

            {image && mode === "auto" && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-subtle p-2">
                {image.mime === "image/jpeg" || image.mime === "image/png" || image.mime === "image/webp" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`data:${image.mime};base64,${image.data}`} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <FileText className="m-3 h-6 w-6 shrink-0 text-primary" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{image.name}</span>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  aria-label={t.hero.removeImage}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {canPaste && (
                <button type="button" onClick={paste} className="btn btn-secondary min-h-[44px] flex-1 px-3 text-sm sm:flex-none">
                  <ClipboardPaste className="h-4 w-4" aria-hidden /> {t.hero.paste}
                </button>
              )}
              {mode === "auto" && (
              <label className="btn btn-secondary min-h-[44px] flex-1 cursor-pointer whitespace-nowrap px-3 text-sm focus-within:border-primary sm:flex-none">
                <Paperclip className="h-4 w-4" aria-hidden /> {t.hero.screenshot}
                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf,.heic,.heif"
                  className="sr-only"
                  onChange={(e) => {
                    attach(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              )}
              <button
                type="submit"
                className="btn btn-primary min-h-[44px] w-full sm:ml-auto sm:w-auto"
                disabled={!text.trim() && !(image && mode === "auto")}
              >
                {t.hero.check}
              </button>
            </div>
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
                <button type="button" onClick={() => setError(null)} className="btn btn-secondary mt-3 min-h-[40px] px-3 py-1 text-sm">
                  {t.errors.retry}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-center text-sm text-muted">{t.hero.demosTitle}</p>
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
              {DEMO_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const m: CheckMode = id === "company" ? "company" : "auto";
                    setMode(m);
                    setText(DEMO_INPUTS[id]);
                    setImage(null);
                    run({ demoId: id, text: DEMO_INPUTS[id], mode: m });
                  }}
                  className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-primary"
                >
                  {t.hero.demos[id]}
                </button>
              ))}
            </div>
          </div>

          <HistoryPanel onOpen={openHistory} />

          <Link href="/protect" className="mt-6 flex items-center gap-3 rounded-2xl bg-primary-soft p-4 transition-colors hover:bg-primary-soft/70">
            <span className="icon-badge shrink-0 bg-primary text-on-primary">
              <HeartHandshake className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{t.protect.homeTitle}</span>
              <span className="mt-0.5 block text-sm leading-snug">{t.protect.homeText}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
              <span className="hidden sm:inline">{t.protect.homeButton}</span>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </span>
          </Link>

          <InstallCard />

          <details className="group mt-6 rounded-2xl bg-subtle">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2 px-4 font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{t.more.title}</span>
              <ChevronDown className="h-5 w-5 text-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
              {t.hero.what.map(([title, desc], i) => {
                const Icon = WHAT_ICONS[i];
                return (
                  <li key={title} className="flex gap-3 rounded-xl bg-surface p-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted">{desc}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>

          <p className="mt-6 text-center text-xs text-muted">{t.hero.privacyNote}</p>
        </section>
      )}
    </div>
  );
}
