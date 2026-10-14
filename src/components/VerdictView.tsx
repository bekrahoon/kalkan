"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Flag,
  Info,
  RefreshCw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  XCircle,
} from "lucide-react";
import { useLang } from "./LangProvider";
import { SCHEMES } from "@/content/schemes";
import type { CheckResult, SignalLevel, Verdict } from "@/lib/types";

const STATIC_DEMO = process.env.NEXT_PUBLIC_KALKAN_STATIC === "1";
const SITE = "https://kalkan-sigma.vercel.app";

export const VERDICT_STYLE: Record<Verdict, { band: string; text: string; Icon: typeof ShieldAlert }> = {
  danger: { band: "bg-danger-soft", text: "text-danger", Icon: ShieldAlert },
  suspicious: { band: "bg-warn-soft", text: "text-warn", Icon: AlertTriangle },
  safe: { band: "bg-primary-soft", text: "text-primary", Icon: ShieldCheck },
  unknown: { band: "bg-subtle", text: "text-muted", Icon: ShieldQuestion },
};

const SIGNAL_ICON: Record<SignalLevel, { Icon: typeof Info; cls: string }> = {
  bad: { Icon: XCircle, cls: "text-danger" },
  warn: { Icon: AlertTriangle, cls: "text-warn" },
  good: { Icon: CheckCircle2, cls: "text-primary" },
  info: { Icon: Info, cls: "text-muted" },
};

export function VerdictView({
  result,
  onReset,
  onRerun,
}: {
  result: CheckResult;
  onReset: () => void;
  onRerun?: () => void;
}) {
  const { t, lang } = useLang();
  const tv = t.verdict;
  const style = VERDICT_STYLE[result.verdict];
  const scheme = result.scheme ? SCHEMES[result.lang][result.scheme] : null;

  return (
    <section className="mx-auto max-w-2xl px-4 pt-5 sm:pt-8">
      <button type="button" onClick={onReset} className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {tv.again}
      </button>

      <article className="card fade-in overflow-hidden">
        <header className={`${style.band} p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface ${style.text}`}>
              <style.Icon className="h-7 w-7" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-bold uppercase tracking-wide ${style.text}`}>{tv.label[result.verdict]}</p>
              <p className="truncate text-sm text-muted" title={result.subject}>
                {result.subject}
              </p>
            </div>
          </div>
          <h1 className="mt-4 text-[clamp(1.5rem,5.5vw,2rem)] font-bold leading-tight">{result.title}</h1>
          <p className="mt-2 leading-relaxed">{result.summary}</p>
          {result.reports > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-danger">
              <Flag className="h-4 w-4" aria-hidden /> {tv.reports(result.reports)}
            </p>
          )}
        </header>

        {(result.demo || result.aiSkipped || result.lang !== lang) && (
          <div className="space-y-2 border-b border-line px-5 py-3 text-sm text-muted sm:px-6">
            {result.demo && <p>{tv.demo}</p>}
            {result.aiSkipped && <p>{tv.aiSkipped}</p>}
            {result.lang !== lang && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {tv.otherLang}
                {onRerun && (
                  <button type="button" onClick={onRerun} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden /> {tv.rerun}
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        <div className="space-y-7 p-5 sm:p-6">
          {result.signals.length > 0 && (
            <section aria-labelledby="why">
              <h2 id="why" className="text-lg font-bold">
                {tv.why}
              </h2>
              <ul className="mt-3 space-y-3">
                {result.signals.map((s, i) => {
                  const { Icon, cls } = SIGNAL_ICON[s.level];
                  return (
                    <li key={i} className="flex gap-3 leading-snug">
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls}`} aria-label={tv.level[s.level]} />
                      <span>{s.text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {scheme && result.scheme && (
            <Link href={`/schemes#${result.scheme}`} className="block rounded-2xl border border-line p-4 hover:border-primary">
              <p className="text-sm text-muted">{tv.scheme}</p>
              <p className="mt-0.5 font-semibold">{scheme.name}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{scheme.how}</p>
              <p className="mt-2 text-sm font-medium text-primary">{tv.schemeMore} →</p>
            </Link>
          )}

          {result.links.length > 0 && (
            <section aria-labelledby="links">
              <h2 id="links" className="text-lg font-bold">
                {tv.links}
              </h2>
              <ul className="mt-3 space-y-2">
                {result.links.map((l, i) => (
                  <li key={i}>
                    <LinkCard result={l} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="todo">
            <h2 id="todo" className="text-lg font-bold">
              {tv.todo}
            </h2>
            <ol className="mt-3 space-y-2.5">
              {result.advice.map((a, i) => (
                <li key={i} className="flex gap-3 leading-snug">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
                  <span className="pt-0.5">{a}</span>
                </li>
              ))}
            </ol>
          </section>

          {result.facts.length > 0 && <Facts result={result} title={tv.details} />}
        </div>
      </article>

      <Actions result={result} />

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">{tv.disclaimer}</p>
    </section>
  );
}

function Facts({ result, title }: { result: CheckResult; title: string }) {
  return (
    <details className="group rounded-2xl bg-subtle">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-4 font-medium">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <dl className="space-y-2 px-4 pb-4 text-sm">
        {result.facts.map((f, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
            <dt className="text-muted">{f.label}</dt>
            <dd className="break-words font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function LinkCard({ result }: { result: CheckResult }) {
  const { t } = useLang();
  const style = VERDICT_STYLE[result.verdict];
  return (
    <details className="group rounded-2xl border border-line">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-3">
        <style.Icon className={`h-5 w-5 shrink-0 ${style.text}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{result.subject}</span>
          <span className={`block text-xs font-semibold ${style.text}`}>{t.verdict.label[result.verdict]}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="space-y-2 px-3 pb-3 text-sm">
        {result.signals.map((s, i) => {
          const { Icon, cls } = SIGNAL_ICON[s.level];
          return (
            <li key={i} className="flex gap-2 leading-snug">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cls}`} aria-hidden />
              {s.text}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function Actions({ result }: { result: CheckResult }) {
  const { t } = useLang();
  const tv = t.verdict;
  const [report, setReport] = useState<"idle" | "busy" | "done" | "fail">("idle");
  const [shared, setShared] = useState(false);
  const canReport = !result.demo && !STATIC_DEMO && result.verdict !== "safe" && result.indicators.length > 0;

  const doReport = async () => {
    setReport("busy");
    try {
      const r = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicators: result.indicators }),
      });
      const j = (await r.json()) as { ok?: boolean };
      setReport(j.ok ? "done" : "fail");
    } catch {
      setReport("fail");
    }
  };

  const doShare = async () => {
    const site = STATIC_DEMO ? SITE : window.location.origin;
    const text = tv.shareText(result.subject, tv.label[result.verdict].toLowerCase(), result.title);
    try {
      if (navigator.share) {
        await navigator.share({ text, url: site });
        return;
      }
    } catch {
      /* cancelled → fall back to copying */
    }
    try {
      await navigator.clipboard.writeText(`${text} ${site}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {canReport && (
        <div>
          {report === "done" ? (
            <p role="status" className="flex gap-2 rounded-2xl bg-primary-soft p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden /> {tv.reported}
            </p>
          ) : (
            <>
              <button type="button" onClick={doReport} disabled={report === "busy"} className="btn btn-danger w-full">
                <Flag className="h-4 w-4" aria-hidden /> {tv.report}
              </button>
              <p className="mt-1.5 text-center text-xs text-muted">{report === "fail" ? tv.reportFail : tv.reportWhat}</p>
            </>
          )}
        </div>
      )}
      <button type="button" onClick={doShare} className="btn btn-secondary w-full">
        <Share2 className="h-4 w-4" aria-hidden /> {shared ? tv.shared : tv.share}
      </button>
    </div>
  );
}
