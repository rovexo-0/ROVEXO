"use client";

/**
 * OPT-HP-PERF — Black Underground theme CSS is not on the platform critical path.
 * Light Homepage LCP must not download ~46KB of dark-theme rules.
 * Load before applying `data-theme="dark"`; idle-prefetch for light users.
 */
let loadPromise: Promise<void> | null = null;

export function loadBlackUndergroundThemeCss(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = import(
    /* webpackChunkName: "black-underground-theme-v1" */
    "@/styles/rovexo/black-underground-theme-v1.css"
  ).then(() => undefined);
  return loadPromise;
}

export function prefetchBlackUndergroundThemeCssIdle(): void {
  if (typeof window === "undefined") return;
  const run = () => {
    void loadBlackUndergroundThemeCss();
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 4000 });
    return;
  }
  window.setTimeout(run, 2500);
}
