"use client";

import { useSyncExternalStore } from "react";
import type { AnalyzeMeta, AnalyzeRequest, Lang, Report } from "./types";

/** Recent reports, kept only in this browser (localStorage). Nothing is sent anywhere. */
export interface HistoryItem {
  id: string;
  at: number;
  lang: Lang;
  label: string;
  report: Report;
  meta: AnalyzeMeta;
  example: boolean;
  /** Kept for links and examples only (small), so the report can be rebuilt in another language. */
  request?: Omit<AnalyzeRequest, "lang">;
}

const KEY = "kalkan-history-v1";
const EVT = "kalkan-history-change";
const MAX = 12;
let memory: HistoryItem[] = [];
let snapshot: HistoryItem[] | null = null;

function read(): HistoryItem[] {
  if (snapshot) return snapshot;
  try {
    const raw = localStorage.getItem(KEY);
    snapshot = raw ? (JSON.parse(raw) as HistoryItem[]) : memory;
  } catch {
    snapshot = memory;
  }
  return snapshot;
}

function write(items: HistoryItem[]) {
  memory = items;
  snapshot = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked — keep in memory for this visit */
  }
  window.dispatchEvent(new Event(EVT));
}

const EMPTY: HistoryItem[] = [];

export function useHistory(): HistoryItem[] {
  return useSyncExternalStore(
    (cb) => {
      const on = () => {
        snapshot = null;
        cb();
      };
      window.addEventListener(EVT, cb);
      window.addEventListener("storage", on);
      return () => {
        window.removeEventListener(EVT, cb);
        window.removeEventListener("storage", on);
      };
    },
    read,
    () => EMPTY,
  );
}

export function addToHistory(item: Omit<HistoryItem, "id" | "at">): string {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // Re-checking the same link or example in the same language replaces its older entry.
  const same = item.request ? JSON.stringify(item.request) : null;
  const rest = read().filter((h) => !(same && h.lang === item.lang && h.request && JSON.stringify(h.request) === same));
  write([{ ...item, id, at: Date.now() }, ...rest].slice(0, MAX));
  return id;
}

export function removeFromHistory(id: string) {
  write(read().filter((h) => h.id !== id));
}

export function clearHistory() {
  write([]);
}
