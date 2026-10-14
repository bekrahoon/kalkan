"use client";
/** Phone-demo shim for next/navigation: the "pathname" is derived from the URL hash. */
import { useSyncExternalStore } from "react";

const ROUTES = ["rights", "about"];

export function hashToPath(): string {
  const h = typeof location === "undefined" ? "" : location.hash.replace(/^#/, "");
  return ROUTES.includes(h) ? `/${h}` : "/";
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, hashToPath, () => "/");
}
