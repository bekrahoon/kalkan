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
import { useLang } from "./LangProvider";
import { Reveal } from "./Reveal";
import { RiskGauge, SfxBurst } from "./RiskGauge";
import { LetterGenerator } from "./LetterGenerator";
import type { AnalyzeMeta, CategoryId, Lang, RecipientType, Report, RightId, TriState } from "@/lib/types";

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

function chipClass(v: TriState) {
  return v === "yes" ? "chip chip-yes" : v === "no" ? "chip chip-no" : "chip chip-unclear";
}

function SectionTitle({ children, icon: Icon, danger }: { children: React.ReactNode; icon: IconT; danger?: boolean }) {
  return (
    <h2 className="display slant inked mb-5 flex items-center gap-3 text-[1.75rem] text-white sm:text-4xl">
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-black ${
          danger ? "bg-danger" : "bg-teal"
        } text-black shadow-[3px_3px_0_#000]`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      {children}
    </h2>
  );
}

export function ReportView({
  report,
  meta,
  reportLang,
  onReset,
  onRerun,
}: {
  report: Report;
  meta: AnalyzeMeta;
  reportLang: Lang;
  onReset: () => void;
  onRerun: () => void;
}) {
  const { t, lang } = useLang();
  const r = report;
  const tr = t.report;

  return (
    <article className="mx-auto max-w-5xl px-4 pb-6 pt-8 sm:pt-12" aria-labelledby="report-title">
      <button type="button" onClick={onReset} className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-teal hover:text-amber">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {tr.again}
      </button>

      {/* notices */}
      <div className="mb-6 space-y-3">
        {reportLang !== lang && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border-[3px] border-black bg-ink-3 p-3 text-sm">
            <Languages className="h-5 w-5 text-teal" aria-hidden />
            <span>{tr.otherLang}</span>
            <button type="button" onClick={onRerun} className="btn btn-primary min-h-[40px] px-3 py-1 text-sm">
              {tr.rerun}
            </button>
          </div>
        )}
        {meta.source === "demo-cache" && (
          <p className="flex gap-2 rounded-md border-[3px] border-black bg-ink-3 p-3 text-sm text-fg">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden />
            {tr.demoCache}
          </p>
        )}
        {meta.truncated && (
          <p className="flex gap-2 rounded-md border-[3px] border-black bg-amber p-3 text-sm font-medium text-black">
            <Scissors className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {tr.truncated(meta.analyzedChars, meta.originalChars)}
          </p>
        )}
      </div>

      {/* verdict */}
      <Reveal className={`panel panel-halftone tilt-l p-5 sm:p-8 ${r.risk_level === "high" ? "panel-danger" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="caption caption-teal">{tr.title}</span>
            <h1 id="report-title" className="mt-3 text-lg font-semibold text-fg">
              {tr.about(r.company_name)}
            </h1>
          </div>
          <div className="absolute -right-3 -top-8 sm:-right-6 sm:-top-10">
            <SfxBurst text={tr.sfx[r.risk_level]} level={r.risk_level} />
          </div>
        </div>

        <div className="mt-4 grid items-center gap-6 md:grid-cols-[280px_1fr]">
          <div className="mx-auto flex w-full flex-col items-center">
            <RiskGauge score={r.risk_score} level={r.risk_level} label={`${tr.score}: ${r.risk_score}/100, ${tr.level[r.risk_level]}`} of100={tr.of100} />
            <p
              className={`display mt-2 rounded border-[3px] border-black px-3 py-1 text-xl shadow-[3px_3px_0_#000] ${
                r.risk_level === "low" ? "bg-teal text-black" : r.risk_level === "medium" ? "bg-amber text-black" : "bg-danger text-black"
              }`}
            >
              {tr.level[r.risk_level]}
            </p>
          </div>
          <div className="bubble mb-4">
            <p className="display mb-1 text-sm tracking-widest text-[#0b6f6a]">{tr.verdict}</p>
            <p className="text-[17px] font-medium leading-snug sm:text-lg">{r.summary}</p>
          </div>
        </div>
      </Reveal>

      {/* data categories */}
      <section className="mt-14" aria-labelledby="sec-data">
        <SectionTitle icon={Eye}>
          <span id="sec-data">{tr.dataTitle}</span>
        </SectionTitle>
        <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {r.data_categories.map((c, i) => {
            const Icon = CAT_ICON[c.category];
            return (
              <Reveal as="li" key={c.category} delay={(i % 4) * 70} className={`panel p-4 ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border-[3px] border-black ${
                      c.collected === "yes" ? "bg-amber text-black" : c.collected === "no" ? "bg-teal/90 text-black" : "bg-ink-3 text-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className={chipClass(c.collected)}>{tr.tri[c.collected]}</span>
                </div>
                <h3 className="display mt-3 text-xl text-white">{tr.categories[c.category]}</h3>
                <p className="mt-1 text-sm leading-snug text-fg/85">{c.details}</p>
              </Reveal>
            );
          })}
          {r.other_data.length > 0 && (
            <Reveal as="li" className="panel tilt-r p-4 min-[420px]:col-span-2 lg:col-span-1">
              <h3 className="display text-xl text-white">{tr.otherData}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg/85 marker:text-teal">
                {r.other_data.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Reveal>
          )}
        </ul>
      </section>

      {/* third parties + retention */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="sec-parties">
          <SectionTitle icon={Users}>
            <span id="sec-parties">{tr.partiesTitle}</span>
          </SectionTitle>
          <Reveal className="panel tilt-l p-2 sm:p-3">
            {r.third_parties.length === 0 ? (
              <p className="p-3 text-sm text-muted">{tr.noParties}</p>
            ) : (
              <ul className="divide-y-2 divide-dashed divide-white/10">
                {r.third_parties.map((p, i) => {
                  const Icon = PARTY_ICON[p.type];
                  return (
                    <li key={i} className="flex gap-3 p-3">
                      <span
                        className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-black ${
                          p.type === "advertisers" ? "bg-amber text-black" : "bg-ink-3 text-teal"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{p.recipient}</p>
                        <p className="text-sm text-fg/80">{p.purpose}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="chip bg-ink-3 text-fg">{tr.recipientTypes[p.type]}</span>
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
          </Reveal>
        </section>

        <section aria-labelledby="sec-retention">
          <SectionTitle icon={Clock}>
            <span id="sec-retention">{tr.retentionTitle}</span>
          </SectionTitle>
          <Reveal className="panel panel-halftone tilt-r p-5">
            <p className="display text-2xl leading-tight text-white">{r.retention.period}</p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-dashed border-white/10 pt-4">
              <span className="font-semibold">{tr.canDelete}</span>
              <span className={`${chipClass(r.retention.can_delete === "yes" ? "no" : r.retention.can_delete === "no" ? "yes" : "unclear")} text-sm`}>
                {tr.deleteTri[r.retention.can_delete]}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">{tr.howDelete}</p>
            <p className="mt-1 text-sm leading-snug">{r.retention.how_to_delete}</p>
          </Reveal>
        </section>
      </div>

      {/* red flags */}
      <section className="mt-14" aria-labelledby="sec-flags">
        <SectionTitle icon={Flag} danger>
          <span id="sec-flags">{tr.flagsTitle}</span>
        </SectionTitle>
        {r.red_flags.length === 0 ? (
          <Reveal className="panel p-5 text-fg/90">{tr.flagsNone}</Reveal>
        ) : (
          <ol className="space-y-10">
            {r.red_flags.map((f, i) => (
              <Reveal as="li" key={i} delay={60} className={`panel panel-danger p-5 sm:p-6 ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                <div className="flex items-start gap-3">
                  <span className="display inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border-[3px] border-black bg-danger text-xl text-black">
                    {i + 1}
                  </span>
                  <h3 className="display pt-1 text-2xl leading-tight text-white">{f.title}</h3>
                </div>
                {f.quote && (
                  <figure className="mt-4 border-l-4 border-danger pl-4">
                    <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted">{tr.quoteFrom}</figcaption>
                    <blockquote className="mt-1 font-mono text-[14px] leading-relaxed text-fg">«{f.quote}»</blockquote>
                    {f.quote_verified === false && <p className="mt-1 text-xs text-amber">{tr.quoteUnverified}</p>}
                  </figure>
                )}
                <div className="bubble bubble-up mt-7">
                  <p className="text-[15px] leading-snug sm:text-base">{f.explanation}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        )}
      </section>

      {/* rights */}
      <section className="mt-14" aria-labelledby="sec-rights">
        <SectionTitle icon={Hand}>
          <span id="sec-rights">{tr.rightsTitle}</span>
        </SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {r.user_rights.map((u, i) => {
            const Icon = RIGHT_ICON[u.right];
            return (
              <Reveal as="li" key={u.right} delay={(i % 3) * 70} className={`panel p-4 ${i % 2 ? "tilt-l" : "tilt-r"}`}>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-teal" aria-hidden />
                  <h3 className="flex-1 font-semibold leading-tight text-white">{tr.rights[u.right]}</h3>
                  <span className={chipClass(u.available === "yes" ? "no" : u.available === "no" ? "yes" : "unclear")}>
                    {tr.rightTri[u.available]}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-snug text-fg/80">{u.details}</p>
              </Reveal>
            );
          })}
        </ul>
        <Link href="/rights" className="mt-5 inline-flex min-h-[44px] items-center gap-2 font-semibold text-teal underline decoration-2 underline-offset-4 hover:text-amber">
          {tr.rightsMore} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      {/* letter */}
      <section className="mt-14" aria-label={t.letter.title}>
        <LetterGenerator company={r.company_name} contact={r.contact_email} />
      </section>

      <footer className="mt-12 space-y-3 text-center">
        {meta.sourceUrl && (
          <p className="break-all text-xs text-muted">
            {tr.source}{" "}
            <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal underline">
              {meta.sourceUrl}
            </a>
          </p>
        )}
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-muted">{tr.disclaimer}</p>
        <button type="button" onClick={onReset} className="btn btn-primary mt-3">
          {tr.again}
        </button>
      </footer>
    </article>
  );
}
