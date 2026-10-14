"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DICTS, type Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const LangContext = createContext<Ctx | null>(null);
const KEY = "kalkan-lang";
const EVT = "kalkan-lang-change";
let memoryLang: Lang | null = null;

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "ky" || saved === "ru") return saved;
  } catch {
    /* storage blocked */
  }
  return memoryLang ?? "ru";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => "ru" as Lang);

  useEffect(() => {
    document.documentElement.lang = DICTS[lang].htmlLang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    memoryLang = l;
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage unavailable — keep it in memory only */
    }
    window.dispatchEvent(new Event(EVT));
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
