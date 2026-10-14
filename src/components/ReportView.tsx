"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  BookUser,
  Building2,
  Camera,
  Clock,
  Download,
  Eye,
  Flag,
  Globe2,
  Hand,
  Handshake,
  History,
  Info,
  Landmark,
  Languages,
  Lightbulb,
  Check,
  Share2,
  Smartphone,
  DatabaseZap,
  MapPin,
  Megaphone,
  PencilLine,
  ScanFace,
  Scissors,
  Trash2,
  Undo2,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useLang } from "./LangProvider";
import { Reveal } from "./Reveal";
import { RiskGauge } from "./RiskGauge";
import { LetterGenerator } from "./LetterGenerator";
import { BASE_SCORE, type PlayInfo, type AnalyzeMeta, type CategoryId, type Lang, type RecipientType, type Report, type RightId, type RiskLevel, type TriState } from "@/lib/types";

type IconT = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const CAT_ICON: Record<CategoryId, IconT> = {
  geolocation: MapPin,
  contacts: BookUser,
  biometrics: ScanFace,
  finance: Wallet,
  browsing: History,
  media: Camera,
  children: Baby,
};
const RIGHT_ICON: Record<RightId, IconT> = {
  access: Eye,
  rectification: PencilLine,
  deletion: Trash2,
  withdraw_consent: Undo2,
  portability: Download,
  objection: Hand,
};
const PARTY_ICON: Record<RecipientType, IconT> = {
  advertisers: Megaphone,
  partners: Handshake,
  affiliates: Building2,
  processors: Wrench,
  government: Landmark,
  other: Users,
};

const LEVEL_PILL: Record<RiskLevel, string> = {
  low: "chip-no",
  medium: "chip-yes",
  high: "chip-danger",
};

/** "yes" for data collection is a caution; "yes" for a right is good news. */
function chipFor(v: TriState, goodWhenYes = false) {
  if (v === "unclear") return "chip chip-unclear";
  const good = goodWhenYes ? v === "yes" : v === "no";
  return good ? "chip chip-no" : "chip chip-yes";
}

function SectionTitle({ id, children, icon: Icon, danger }: { id: string; children: React.ReactNode; icon: IconT; danger?: boolean }) {
  return (
    <h2 id={id} className="mb-4 flex items-center gap-2.5 text-xl font-bold sm:text-2xl">
      <span className={`icon-badge h-9 w-9 ${danger ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"}`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      {children}
    </h2>
  );
}

function Notice({ icon: Icon, children, tone = "neutral" }: { icon: IconT; children: React.ReactNode; tone?: "neutral" | "warn" }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-3.5 text-sm ${tone === "warn" ? "bg-warn-soft" : "bg-subtle"}`}>
      <Icon className={`h-4 w-4 shrink-0 ${tone === "warn" ? "text-warn" : "text-primary"}`} aria-hidden />
      {children}
    </div>
  );
}

async function shareText(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ text });
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

function PlaySection({ play }: { play: PlayInfo }) {
  const { t } = useLang();
  const tr = t.report;
  const list = (items: { data: string; purpose: string }[]) =>
    items.length ? (
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((d, i) => (
          <li key={i} className="leading-snug">
            <span className="font-medium">{d.data}</span>
            {d.purpose && <span className="text-muted"> — {d.purpose}</span>}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-sm text-muted">{tr.playNothing}</p>
    );

  return (
    <section className="mt-10" aria-labelledby="sec-play">
      <h2 id="sec-play" className="mb-1 flex items-center gap-2.5 text-xl font-bold sm:text-2xl">
        <span className="icon-badge h-9 w-9 bg-primary-soft text-primary">
          <Smartphone className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {tr.playTitle}
      </h2>
      <p className="mb-4 text-sm text-muted">
        {play.title && <strong className="text-fg">{play.title}</strong>}
        {play.developer && ` · ${play.developer}`}. {tr.playNote}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-semibold">{tr.playShared}</h3>
          {list(play.shared)}
        </div>
        <div className="card p-4">
          <h3 className="font-semibold">{tr.playCollected}</h3>
          {list(play.collected)}
        </div>
        <div className="card p-4 sm:col-span-2">
          <h3 className="font-semibold">{tr.playPermissions}</h3>
          {play.permissions.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {play.permissions.map((p) => (
                <li key={p} className="rounded-full bg-subtle px-2.5 py-1 text-xs">
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">{tr.playNothing}</p>
          )}
          {play.security.length > 0 && (
            <>
              <h3 className="mt-4 font-semibold">{tr.playSecurity}</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                {play.security.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function ReportView({
  report: r,
  meta,
  reportLang,
  onReset,
  onRerun,
  backLabel,
}: {
  report: Report;
  meta: AnalyzeMeta;
  reportLang: Lang;
  onReset: () => void;
  onRerun?: () => void;
  backLabel?: string;
}) {
  const { t, lang } = useLang();
  const tr = t.report;
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const onShare = async () => {
    const lines = [
      `Калкан: ${tr.about(r.company_name)} — ${tr.level[r.risk_level]} (${r.risk_score}/100)`,
      r.summary,
      ...r.red_flags.slice(0, 3).map((f) => `• ${f.title}`),
      "",
      `${tr.shareCta} ${typeof location !== "undefined" ? location.origin + location.pathname : ""}`,
    ];
    const res = await shareText(lines.join("\n"));
    if (res === "copied") {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2200);
    }
  };

  return (
    <article className="mx-auto max-w-4xl px-4 pb-6 pt-6 sm:pt-10" aria-labelledby="report-title">
      <button type="button" onClick={onReset} className="mb-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {backLabel ?? tr.again}
      </button>

      <div className="mb-5 space-y-2.5">
        {reportLang !== lang && onRerun && (
          <Notice icon={Languages}>
            <span className="flex-1">{tr.otherLang}</span>
            <button type="button" onClick={onRerun} className="btn btn-primary min-h-[38px] px-3 py-1 text-sm">
              {tr.rerun}
            </button>
          </Notice>
        )}
        {meta.cached && <Notice icon={DatabaseZap}>{tr.cached}</Notice>}
        {meta.source === "demo-cache" && (
          <Notice icon={Info}>{meta.fallbackReason === "static_demo" ? tr.demoExample : tr.demoCache}</Notice>
        )}
        {meta.truncated && (
          <Notice icon={Scissors} tone="warn">
            {tr.truncated(meta.analyzedChars, meta.originalChars)}
          </Notice>
        )}
      </div>

      {/* verdict */}
      <section className="card fade-in p-5 sm:p-7">
        <p className="eyebrow">{tr.title}</p>
        <h1 id="report-title" className="mt-1 text-2xl font-bold sm:text-3xl">
          {tr.about(r.company_name)}
        </h1>
        <div className="mt-6 grid items-center gap-6 sm:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center gap-3">
            <RiskGauge score={r.risk_score} level={r.risk_level} label={`${tr.score}: ${r.risk_score}/100, ${tr.level[r.risk_level]}`} of100={tr.of100} />
            <span className={`chip ${LEVEL_PILL[r.risk_level]} px-3 py-1 text-sm`}>{tr.level[r.risk_level]}</span>
          </div>
          <div className="rounded-2xl bg-subtle p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{tr.verdict}</p>
            <p className="mt-1.5 text-[17px] leading-relaxed">{r.summary}</p>
          </div>
        </div>

        {r.risk_factors.length > 0 && (
          <div className="mt-6 border-t border-line pt-5">
            <h2 className="text-base font-semibold">{tr.factorsTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3 text-muted">
                <span>{tr.factorsBase}</span>
                <span className="tabular-nums font-medium">{BASE_SCORE}</span>
              </li>
              {r.risk_factors.map((f, i) => {
                const up = f.points > 0;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 leading-snug">{f.factor}</span>
                    <span
                      className={`chip shrink-0 tabular-nums ${up ? "chip-danger" : "chip-no"}`}
                      aria-label={`${up ? "+" : "−"}${Math.abs(f.points)}`}
                    >
                      {up ? "+" : "−"}
                      {Math.abs(f.points)}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-center justify-between gap-3 border-t border-line pt-2 font-semibold">
                <span>{tr.factorsTotal}</span>
                <span className="tabular-nums">
                  {r.risk_score} {tr.of100}
                </span>
              </li>
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          <button type="button" onClick={onShare} className="btn btn-secondary min-h-[42px] text-sm">
            {shareState === "copied" ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
            {shareState === "copied" ? tr.shared : tr.share}
          </button>
          <span aria-live="polite" className="sr-only">
            {shareState === "copied" ? tr.shared : ""}
          </span>
        </div>
      </section>

      {/* data categories */}
      <section className="mt-10" aria-labelledby="sec-data">
        <SectionTitle id="sec-data" icon={Eye}>
          {tr.dataTitle}
        </SectionTitle>
        <ul className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-3">
          {r.data_categories.map((c, i) => {
            const Icon = CAT_ICON[c.category];
            const tone = c.collected === "yes" ? "bg-warn-soft text-warn" : c.collected === "no" ? "bg-primary-soft text-primary" : "bg-subtle text-muted";
            return (
              <Reveal as="li" key={c.category} delay={(i % 3) * 50} className="card flex gap-3 p-4">
                <span className={`icon-badge ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <h3 className="font-semibold">{tr.categories[c.category]}</h3>
                    <span className={chipFor(c.collected)}>{tr.tri[c.collected]}</span>
                  </div>
                  <p className="mt-1 text-sm leading-snug text-muted">{c.details}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
        {r.other_data.length > 0 && (
          <div className="mt-3 rounded-2xl bg-subtle p-4">
            <p className="text-sm font-semibold">{tr.otherData}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {r.other_data.map((o, i) => (
                <li key={i} className="rounded-full bg-surface px-3 py-1 text-sm">
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {meta.play?.available && <PlaySection play={meta.play} />}

      {/* third parties + retention */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="sec-parties">
          <SectionTitle id="sec-parties" icon={Users}>
            {tr.partiesTitle}
          </SectionTitle>
          <div className="card px-4 py-1">
            {r.third_parties.length === 0 ? (
              <p className="py-3 text-sm text-muted">{tr.noParties}</p>
            ) : (
              <ul className="divide-y divide-line">
                {r.third_parties.map((p, i) => {
                  const Icon = PARTY_ICON[p.type];
                  return (
                    <li key={i} className="flex gap-3 py-3">
                      <span className={`icon-badge h-9 w-9 ${p.type === "advertisers" ? "bg-warn-soft text-warn" : "bg-subtle text-muted"}`}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{p.recipient}</p>
                        <p className="text-sm text-muted">{p.purpose}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="chip chip-unclear">{tr.recipientTypes[p.type]}</span>
                          {p.cross_border && (
                            <span className="chip chip-yes">
                              <Globe2 className="h-3 w-3" aria-hidden />
                              {tr.crossBorder}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="sec-retention">
          <SectionTitle id="sec-retention" icon={Clock}>
            {tr.retentionTitle}
          </SectionTitle>
          <div className="card p-5">
            <p className="text-lg font-semibold leading-snug">{r.retention.period}</p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-sm font-medium">{tr.canDelete}</span>
              <span className={chipFor(r.retention.can_delete, true)}>{tr.deleteTri[r.retention.can_delete]}</span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">{tr.howDelete}</p>
            <p className="mt-1 text-sm leading-snug">{r.retention.how_to_delete}</p>
          </div>
        </section>
      </div>

      {/* red flags */}
      <section className="mt-10" aria-labelledby="sec-flags">
        <SectionTitle id="sec-flags" icon={Flag} danger>
          {tr.flagsTitle}
        </SectionTitle>
        {r.red_flags.length === 0 ? (
          <div className="card p-5 text-muted">{tr.flagsNone}</div>
        ) : (
          <ol className="space-y-3">
            {r.red_flags.map((f, i) => (
              <Reveal as="li" key={i} className="card overflow-hidden border-l-4 border-l-danger p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-soft text-sm font-bold text-danger">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-snug">{f.title}</h3>
                    <p className="mt-1.5 leading-relaxed">{f.explanation}</p>
                    {f.action && (
                      <div className="mt-3 flex gap-2.5 rounded-xl bg-primary-soft p-3">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <p className="text-sm leading-snug">
                          <span className="font-semibold text-primary">{tr.actionLabel}: </span>
                          {f.action}
                        </p>
                      </div>
                    )}
                    {f.quote && (
                      <figure className="mt-3 rounded-xl bg-subtle p-3">
                        <figcaption className="text-xs font-medium text-muted">{tr.quoteFrom}</figcaption>
                        <blockquote className="mt-1 text-sm italic leading-relaxed">«{f.quote}»</blockquote>
                        {f.quote_verified === false && <p className="mt-1 text-xs text-warn">{tr.quoteUnverified}</p>}
                      </figure>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        )}
      </section>

      {/* rights */}
      <section className="mt-10" aria-labelledby="sec-rights">
        <SectionTitle id="sec-rights" icon={Hand}>
          {tr.rightsTitle}
        </SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
          {r.user_rights.map((u) => {
            const Icon = RIGHT_ICON[u.right];
            return (
              <li key={u.right} className="card p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <h3 className="flex-1 font-medium leading-snug">{tr.rights[u.right]}</h3>
                  <span className={chipFor(u.available, true)}>{tr.rightTri[u.available]}</span>
                </div>
                <p className="mt-2 text-sm leading-snug text-muted">{u.details}</p>
              </li>
            );
          })}
        </ul>
        <Link href="/rights" className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline">
          {tr.rightsMore} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section className="mt-10" aria-label={t.letter.title}>
        <LetterGenerator company={r.company_name} contact={r.contact_email} />
      </section>

      <footer className="mt-10 space-y-3 text-center">
        {meta.sourceUrl && (
          <p className="break-all text-xs text-muted">
            {tr.source}{" "}
            <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {meta.sourceUrl}
            </a>
          </p>
        )}
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-muted">{tr.disclaimer}</p>
        <button type="button" onClick={onReset} className="btn btn-primary mt-2">
          {backLabel ?? tr.again}
        </button>
      </footer>
    </article>
  );
}
