"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ShieldCheck, ShieldX } from "lucide-react";
import { useLang } from "./LangProvider";
import { CONSENT, CONSENT_VERSION, LEGAL_UPDATED } from "@/content/legal";

/*
 * First-visit agreement window. "yes" is remembered in this browser for the current version of the texts;
 * "no" lasts only for this visit, so the person can change their mind.
 */
type State = "yes" | "no" | "unknown";
const KEY = "kalkan-consent";
const EVT = "kalkan-consent-change";
let memory: State = "unknown";

function read(): State {
  if (memory !== "unknown") return memory;
  try {
    return localStorage.getItem(KEY) === CONSENT_VERSION ? "yes" : "unknown";
  } catch {
    return "unknown";
  }
}

export const readConsentNow = read;

export function setConsent(v: State) {
  memory = v;
  try {
    if (v === "yes") localStorage.setItem(KEY, CONSENT_VERSION);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: keep for this visit */
  }
  window.dispatchEvent(new Event(EVT));
}

/** Server render and the first paint say "yes" so nothing flashes before the browser state is known. */
export function useConsent(): State {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    read,
    () => "yes",
  );
}

const LEGAL_PAGES = ["/privacy", "/terms"];

export function ConsentModal() {
  const consent = useConsent();
  const path = usePathname();
  const onLegal = LEGAL_PAGES.includes(path);
  const open = consent === "unknown" && !onLegal;
  const { lang, setLang } = useLang();
  const c = CONSENT[lang];
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open && !(consent === "no" && !onLegal)) return;
    acceptRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, consent, onLegal]);

  if (consent === "no" && !onLegal) return <Declined />;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="fade-in max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="icon-badge bg-primary-soft text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <h2 id="consent-title" className="flex-1 text-xl font-bold">
            {c.title}
          </h2>
          <div role="group" aria-label="Язык / Тил" className="flex shrink-0 rounded-lg bg-subtle p-1">
            {(["ru", "ky"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`min-h-[32px] min-w-[38px] rounded-md px-2 text-xs font-semibold ${lang === l ? "bg-surface text-fg shadow-sm" : "text-muted"}`}
              >
                {l === "ru" ? "RU" : "KG"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-muted">{c.lead}</p>
        <ul className="mt-3 space-y-2.5">
          {c.points.map((p) => (
            <li key={p} className="flex gap-3 leading-snug">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-2xl bg-subtle p-4 text-sm">
          <p className="text-muted">{c.read}</p>
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/privacy" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
              <FileText className="h-4 w-4" aria-hidden /> {c.privacy}
            </Link>
            <Link href="/terms" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
              <FileText className="h-4 w-4" aria-hidden /> {c.terms}
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            {c.updated}: {LEGAL_UPDATED}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => {
              setConsent("no");
              leaveSite();
            }}>
            {c.cancel}
          </button>
          <button ref={acceptRef} type="button" className="btn btn-primary" onClick={() => setConsent("yes")}>
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

/** After "Cancel": leave the way the person came, otherwise a full page that blocks the site. */
function leaveSite() {
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.origin !== location.origin && history.length > 1) {
      history.back();
      return;
    }
  } catch {
    /* no referrer */
  }
  window.close();
}

function Declined() {
  const { lang } = useLang();
  const c = CONSENT[lang];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="declined-title" className="w-full max-w-md text-center">
        <ShieldX className="mx-auto h-14 w-14 text-muted" aria-hidden />
        <h2 id="declined-title" className="mt-4 text-2xl font-bold">
          {c.declinedTitle}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">{c.declinedText}</p>
        <div className="mt-6 grid gap-2">
          <button type="button" className="btn btn-primary" onClick={() => setConsent("unknown")}>
            {c.again}
          </button>
          <button type="button" className="btn btn-secondary" onClick={leaveSite}>
            {c.leave}
          </button>
        </div>
        <p className="mt-6 text-sm">
          <Link href="/privacy" className="text-primary hover:underline">{c.privacy}</Link>
          {" · "}
          <Link href="/terms" className="text-primary hover:underline">{c.terms}</Link>
        </p>
      </div>
    </div>
  );
}
