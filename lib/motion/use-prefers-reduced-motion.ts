"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * SSR-safe replacement for framer-motion's `useReducedMotion`.
 *
 * framer-motion's hook reads the live media query on the client's very first
 * render while the server assumes `false`, which produces a hydration mismatch
 * for users who prefer reduced motion (the animated `initial` state and the
 * `whileHover`/`whileTap`-derived `tabindex` differ between server and client).
 *
 * `useSyncExternalStore` uses `getServerSnapshot` (always `false`) for both the
 * server render and the first client hydration render, so markup matches, then
 * updates to the real preference immediately after hydration — no mismatch.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
