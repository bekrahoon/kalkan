"use client";

import { useId, useState } from "react";
import { AlertCircle, Check, ClipboardCheck, Copy, FilePen } from "lucide-react";
import { useLang } from "./LangProvider";
import { LoadingView } from "./LoadingView";
import { ReportView } from "./ReportView";
import { BIZ } from "@/content/business";
import type { AnalyzeMeta, AnalyzeResponse, ErrorCode, Lang, Report } from "@/lib/types";

const STATIC_DEMO = process.env.NEXT_PUBLIC_KALKAN_STATIC === "1";

type Tab = "check" | "make";

export function BusinessContent() {
  const { t, lang } = useLang();
  const b = BIZ[lang];
  const [tab, setTab] = useState<Tab>("check");

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="eyebrow">{b.kicker}</p>
      <h1 className="mt-2 text-[clamp(1.8rem,6.5vw,2.5rem)] font-bold leading-tight">{b.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{b.lead}</p>

      <div role="tablist" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1">
        {(
          [
            ["check", b.tabCheck, ClipboardCheck],
            ["make", b.tabMake, FilePen],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium ${
              tab === id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === "check" ? <CheckOwn errors={t.errors} /> : <MakePolicy />}</div>
    </div>
  );
}

function CheckOwn({ errors }: { errors: Record<ErrorCode, string> }) {
  const { lang } = useLang();
  const b = BIZ[lang];
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [result, setResult] = useState<{ report: Report; meta: AnalyzeMeta; lang: Lang } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    if (STATIC_DEMO) return setError("static_demo");
    const isUrl = /^(https?:\/\/)?[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(v) && v.length < 400;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { mode: "url", url: v, lang } : { mode: "text", text: v, lang }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (data.ok) setResult({ report: data.report, meta: data.meta, lang });
      else setError(data.error.code);
    } catch {
      setError("network");
    } finally {
      setBusy(false);
    }
  };

  if (busy) return <LoadingView onCancel={() => setBusy(false)} />;
  if (result)
    return (
      <div className="-mx-4">
        <ReportView report={result.report} meta={result.meta} reportLang={result.lang} onReset={() => setResult(null)} business />
      </div>
    );

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <label htmlFor="biz-policy" className="mb-2 block text-sm font-medium">
        {b.checkLabel}
      </label>
      <textarea
        id="biz-policy"
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={b.checkPh}
        className="field resize-y text-sm"
      />
      <button type="submit" disabled={!value.trim()} className="btn btn-primary mt-3 w-full">
        {b.check}
      </button>
      {error && (
        <p role="alert" className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
          {errors[error]}
        </p>
      )}
    </form>
  );
}

function MakePolicy() {
  const { lang } = useLang();
  const b = BIZ[lang];
  const id = useId();
  const [form, setForm] = useState({
    company: "",
    address: "",
    site: "",
    contact: "",
    recipients: "",
    retention: "",
    crossBorder: false,
    children: false,
  });
  const [data, setData] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [policyLang, setPolicyLang] = useState<Lang>(lang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<{ title: string; sections: { heading: string; body: string }[] } | null>(null);
  const [copied, setCopied] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim()) return setError(b.required);
    if (STATIC_DEMO) return setError(BIZ[lang].error);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, data, purposes, lang: policyLang }),
      });
      const j = await res.json();
      if (j.ok) setPolicy(j);
      else setError(b.error);
    } catch {
      setError(b.error);
    } finally {
      setBusy(false);
    }
  };

  const fullText = policy ? `${policy.title}\n\n${policy.sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n")}` : "";

  if (busy)
    return (
      <div className="card p-6 text-center text-muted" role="status">
        <span className="spin mx-auto mb-3 block h-6 w-6 rounded-full border-2 border-primary border-t-transparent" aria-hidden />
        {b.making}
      </div>
    );

  if (policy)
    return (
      <div>
        <p className="flex gap-2 rounded-xl bg-warn-soft p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
          {b.draftNote}
        </p>
        <article className="card mt-4 p-5 sm:p-6">
          <h2 className="text-xl font-bold">{policy.title}</h2>
          {policy.sections.map((s, i) => (
            <section key={i} className="mt-5">
              <h3 className="font-semibold">{s.heading}</h3>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{s.body}</p>
            </section>
          ))}
        </article>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(fullText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* clipboard blocked */
              }
            }}
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? b.copied : b.copy}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setPolicy(null)}>
            {b.again}
          </button>
        </div>
      </div>
    );

  const field = (key: "company" | "address" | "site" | "contact" | "recipients" | "retention", label: string, ph = "", req = false) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-1 block text-sm font-medium">
        {label}
        {req && " *"}
      </label>
      <input
        id={`${id}-${key}`}
        className="field"
        value={form[key]}
        placeholder={ph}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required={req}
      />
    </div>
  );

  const checks = (title: string, options: string[], list: string[], set: (v: string[]) => void) => (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
              list.includes(o) ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface"
            }`}
          >
            <input type="checkbox" className="sr-only" checked={list.includes(o)} onChange={() => toggle(list, set, o)} />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form onSubmit={submit} className="card space-y-4 p-4 sm:p-5" noValidate>
      {field("company", b.company, "", true)}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("site", b.site)}
        {field("contact", b.contact)}
      </div>
      {field("address", b.address)}
      {checks(b.dataTitle, b.data, data, setData)}
      {checks(b.purposesTitle, b.purposes, purposes, setPurposes)}
      {field("recipients", b.recipients, b.recipientsPh)}
      {field("retention", b.retention, b.retentionPh)}
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={form.crossBorder} onChange={(e) => setForm({ ...form, crossBorder: e.target.checked })} />
        {b.crossBorder}
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={form.children} onChange={(e) => setForm({ ...form, children: e.target.checked })} />
        {b.children}
      </label>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">{b.policyLang}</legend>
        <div className="flex rounded-xl bg-subtle p-1">
          {(["ru", "ky"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={policyLang === l}
              onClick={() => setPolicyLang(l)}
              className={`min-h-[40px] flex-1 rounded-lg text-sm font-medium ${policyLang === l ? "bg-surface text-fg shadow-sm" : "text-muted"}`}
            >
              {l === "ru" ? "Русский" : "Кыргызча"}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="flex gap-2 rounded-xl bg-warn-soft p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full">
        {b.make}
      </button>
    </form>
  );
}
