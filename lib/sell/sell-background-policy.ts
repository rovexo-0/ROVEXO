/** Background sell work — never runs synchronously on keystrokes. */
export const sellBackgroundPolicy = {
  categorySuggestEnabled: true,
  /** Debounce before category / AI suggestion work (ms). */
  categoryDebounceMs: 1000,
  photoAiEnabled: false,
  autoLocationEnabled: false,
} as const;

/** Yield to the browser before heavy sell background work. */
export function runSellBackgroundTask(task: () => void): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 2_000 });
    return;
  }
  globalThis.setTimeout(task, 0);
}
