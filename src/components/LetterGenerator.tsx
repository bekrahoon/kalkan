"use client";

import { useId, useMemo, useState } from "react";
import { Check, Copy, Mail, MailWarning } from "lucide-react";
import { useLang } from "./LangProvider";
import { buildLetter, type LetterLang } from "@/lib/i18n";

const LETTER_LANGS: { id: LetterLang; label: string }[] = [
  { id: "ru", label: "Русский" },
  { id: "ky", label: "Кыргызча" },
  { id: "en", label: "English" },
];

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for http:// or older mobile browsers.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function LetterGenerator({ company, contact }: { company: string; contact: string }) {
  const { t, lang } = useLang();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [companyName, setCompanyName] = useState(company);
  const [letterLang, setLetterLang] = useState<LetterLang>(lang);
  const [copied, setCopied] = useState(false);

  const letter = useMemo(
    () => buildLetter(letterLang, { company: companyName, name, account, date: new Date() }),
    [letterLang, companyName, name, account],
  );
  const full = `${letter.subject}\n\n${letter.body}`;

  const onCopy = async () => {
    if (await copyText(full)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const mailto = contact
    ? `mailto:${contact}?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`
    : undefined;

  if (!open) {
    return (
      <div className="text-center">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-primary w-full sm:w-auto" aria-expanded={false}>
          <MailWarning className="h-5 w-5" aria-hidden />
          {t.letter.open}
        </button>
      </div>
    );
  }

  return (
    <div className="card fade-in p-4 sm:p-6">
      <h2 className="text-xl font-bold">{t.letter.title}</h2>
      <p className="mt-3 text-sm text-muted">{t.letter.intro}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1 block text-sm font-medium">
            {t.letter.name}
          </label>
          <input id={`${id}-name`} className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.letter.namePh} autoComplete="name" />
        </div>
        <div>
          <label htmlFor={`${id}-acc`} className="mb-1 block text-sm font-medium">
            {t.letter.email}
          </label>
          <input id={`${id}-acc`} className="field" value={account} onChange={(e) => setAccount(e.target.value)} placeholder={t.letter.emailPh} autoComplete="email" />
        </div>
        <div>
          <label htmlFor={`${id}-co`} className="mb-1 block text-sm font-medium">
            {t.letter.company}
          </label>
          <input id={`${id}-co`} className="field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <fieldset>
          <legend className="mb-1 block text-sm font-medium">{t.letter.letterLang}</legend>
          <div className="flex rounded-xl bg-subtle p-1">
            {LETTER_LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLetterLang(l.id)}
                aria-pressed={letterLang === l.id}
                className={`min-h-[40px] flex-1 rounded-lg px-2 text-sm font-medium ${letterLang === l.id ? "bg-surface text-fg shadow-sm" : "text-muted"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-4 text-sm">
        <span className="font-medium text-muted">{t.letter.to} </span>
        {contact ? <span className="select-all font-medium text-primary">{contact}</span> : <span className="text-warn">{t.letter.noContact}</span>}
      </p>

      <label htmlFor={`${id}-body`} className="sr-only">
        {t.letter.preview}
      </label>
      <textarea
        id={`${id}-body`}
        readOnly
        value={full}
        rows={14}
        className="field mt-2 resize-y bg-subtle text-sm leading-relaxed"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onCopy} className="btn btn-primary">
          {copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
          {copied ? t.letter.copied : t.letter.copy}
        </button>
        {mailto && (
          <a href={mailto} className="btn btn-secondary">
            <Mail className="h-5 w-5" aria-hidden />
            {t.letter.mail}
          </a>
        )}
        <span aria-live="polite" className="sr-only">
          {copied ? t.letter.copied : ""}
        </span>
      </div>
    </div>
  );
}
