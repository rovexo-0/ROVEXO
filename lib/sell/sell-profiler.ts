/**
 * Sell page runtime profiler — mirrors React Profiler + Performance panel signals.
 *
 * Enable: `/sell?sellProfile=1` or `localStorage.setItem('rovexo:sell-profile', '1')`
 * Dump:   `window.__ROVEXO_SELL_PROFILER__.dump()` in DevTools console
 */

export type SellProfileEvent = {
  t: number;
  kind:
    | "render"
    | "setDraft"
    | "effect"
    | "autosave"
    | "syncText"
    | "categoryDetect"
    | "persist"
    | "bumpPending"
    | "longTask";
  source: string;
  detail?: Record<string, unknown>;
};

const MAX_EVENTS = 2000;

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("rovexo:sell-profile") === "1") return true;
    return new URLSearchParams(window.location.search).has("sellProfile");
  } catch {
    return false;
  }
}

const state = {
  enabled: false,
  events: [] as SellProfileEvent[],
  renderCounts: new Map<string, number>(),
  setDraftCounts: new Map<string, number>(),
};

function push(kind: SellProfileEvent["kind"], source: string, detail?: Record<string, unknown>): void {
  if (!state.enabled) return;

  const event: SellProfileEvent = {
    t: typeof performance !== "undefined" ? Math.round(performance.now()) : 0,
    kind,
    source,
    detail,
  };

  state.events.push(event);
  if (state.events.length > MAX_EVENTS) {
    state.events.splice(0, state.events.length - MAX_EVENTS);
  }

  if (kind === "render") {
    state.renderCounts.set(source, (state.renderCounts.get(source) ?? 0) + 1);
  }
  if (kind === "setDraft") {
    const key = String(detail?.field ?? "unknown");
    state.setDraftCounts.set(key, (state.setDraftCounts.get(key) ?? 0) + 1);
  }

  console.info(`[sell-profile] ${kind} ${source}`, detail ?? "");
}

export function initSellProfiler(): void {
  if (typeof window === "undefined") return;
  state.enabled = isEnabled();
  if (!state.enabled) return;

  (window as Window & { __ROVEXO_SELL_PROFILER__?: unknown }).__ROVEXO_SELL_PROFILER__ = {
    dump: dumpSellProfiler,
    clear: clearSellProfiler,
    events: () => [...state.events],
  };

  console.info("[sell-profile] enabled — call __ROVEXO_SELL_PROFILER__.dump() to export");
}

export function sellProfileRender(component: string, extra?: Record<string, unknown>): void {
  push("render", component, extra);
}

export function sellProfileEffect(source: string, phase: "mount" | "update" | "cleanup"): void {
  push("effect", source, { phase });
}

export function sellProfileSetDraft(field: string, caller: string): void {
  push("setDraft", caller, { field });
}

export function sellProfileAutosave(phase: "schedule" | "fire"): void {
  push("autosave", "SellProvider", { phase });
}

export function sellProfileSyncText(field: "title" | "description", len: number, caller: string): void {
  push("syncText", caller, { field, len });
}

export function sellProfileCategoryDetect(phase: "schedule" | "run" | "setDraft", ms?: number): void {
  push("categoryDetect", "SellProvider", { phase, ms });
}

export function sellProfilePersist(phase: "textSync" | "snapshot"): void {
  push("persist", "persist-sell-draft", { phase });
}

export function sellProfileBumpPending(): void {
  push("bumpPending", "pending-text-store");
}

export function sellProfileLongTask(source: string, ms: number): void {
  if (ms < 16) return;
  push("longTask", source, { ms });
}

export function profileTimed<T>(source: string, fn: () => T): T {
  if (!state.enabled) return fn();
  const start = performance.now();
  const result = fn();
  sellProfileLongTask(source, performance.now() - start);
  return result;
}

export function dumpSellProfiler(): string {
  const summary = {
    renderCounts: Object.fromEntries(state.renderCounts),
    setDraftCounts: Object.fromEntries(state.setDraftCounts),
    recentEvents: state.events.slice(-100),
    totalEvents: state.events.length,
  };
  console.table(summary.renderCounts);
  console.table(summary.setDraftCounts);
  console.info("[sell-profile] recent events", summary.recentEvents);
  return JSON.stringify(summary, null, 2);
}

export function clearSellProfiler(): void {
  state.events = [];
  state.renderCounts.clear();
  state.setDraftCounts.clear();
}
