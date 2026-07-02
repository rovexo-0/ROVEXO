/**
 * Device diagnostics for /sell text input failures.
 * Enable: `localStorage.setItem('rovexo:sell-input-debug', '1')` then reload,
 * or open `/sell?sellDebug=1`
 */

type SellInputDiagDetail = Record<string, unknown>;

function isSellInputDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("rovexo:sell-input-debug") === "1") return true;
    return new URLSearchParams(window.location.search).has("sellDebug");
  } catch {
    return false;
  }
}

export function sellInputDiag(event: string, detail: SellInputDiagDetail = {}): void {
  if (!isSellInputDebugEnabled()) return;
  console.info(`[sell-input] ${event}`, {
    t: typeof performance !== "undefined" ? Math.round(performance.now()) : 0,
    ...detail,
  });
}
