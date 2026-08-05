/**
 * ROVEXO v1.0 — Product View Live Sync (Level 8 Production Lock)
 *
 * publishViewLive ONLY after verified DATABASE +1.
 * Surfaces subscribe to show the same products.views value — no F5.
 *
 * P5 follow-up: slug-scoped listeners so one publish does not wake every
 * ListingCard on Browse / category grids (identical UI behaviour).
 */

"use client";

type ViewLiveEvent = {
  slug: string;
  views: number;
  at: number;
};

type Listener = (event: ViewLiveEvent) => void;
type SlugListener = () => void;

const GLOBAL_KEY = "__rovexo_view_live_v1__" as const;

type ViewLiveStore = {
  /** Full-event listeners (rare). */
  listeners: Set<Listener>;
  /** useSyncExternalStore callbacks keyed by product slug. */
  slugListeners: Map<string, Set<SlugListener>>;
  counts: Map<string, number>;
  channel: BroadcastChannel | null | undefined;
  channelBound: boolean;
};

function getStore(): ViewLiveStore {
  const root = globalThis as typeof globalThis & { [GLOBAL_KEY]?: ViewLiveStore };
  if (!root[GLOBAL_KEY]) {
    root[GLOBAL_KEY] = {
      listeners: new Set(),
      slugListeners: new Map(),
      counts: new Map(),
      channel: undefined,
      channelBound: false,
    };
  } else if (!root[GLOBAL_KEY].slugListeners) {
    // Hot-reload / older store shape — keep counts/channel, add slug map.
    root[GLOBAL_KEY].slugListeners = new Map();
  }
  return root[GLOBAL_KEY];
}

function getChannel(): BroadcastChannel | null {
  const store = getStore();
  if (store.channel !== undefined) return store.channel;
  if (typeof BroadcastChannel === "undefined") {
    store.channel = null;
    return null;
  }
  try {
    store.channel = new BroadcastChannel("rovexo-view-live-v1");
  } catch {
    store.channel = null;
  }
  return store.channel;
}

function notify(event: ViewLiveEvent): void {
  const store = getStore();
  store.counts.set(event.slug, event.views);

  for (const listener of store.listeners) {
    try {
      listener(event);
    } catch {
      // never break
    }
  }

  const slugSet = store.slugListeners.get(event.slug);
  if (!slugSet || slugSet.size === 0) return;
  for (const listener of slugSet) {
    try {
      listener();
    } catch {
      // never break
    }
  }
}

function bindChannelOnce(): void {
  const store = getStore();
  if (store.channelBound) return;
  const channel = getChannel();
  if (!channel) return;
  store.channelBound = true;
  channel.addEventListener("message", (message: MessageEvent<ViewLiveEvent>) => {
    const data = message.data;
    if (!data || typeof data.slug !== "string" || typeof data.views !== "number") return;
    notify(data);
  });
}

/** Publish verified DATABASE view count to every surface. */
export function publishViewLive(input: { slug: string; views: number }): void {
  if (!input.slug || !Number.isFinite(input.views) || input.views < 0) return;
  const event: ViewLiveEvent = {
    slug: input.slug,
    views: Math.floor(input.views),
    at: Date.now(),
  };
  notify(event);
  bindChannelOnce();
  try {
    getChannel()?.postMessage(event);
  } catch {
    // ignore
  }
}

export function getLiveViewCount(slug: string): number | undefined {
  return getStore().counts.get(slug);
}

/** Subscribe to all live view events (full payload). Prefer slug-scoped for cards. */
export function subscribeViewLive(listener: Listener): () => void {
  bindChannelOnce();
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

/** Subscribe only when `slug` receives a verified live view publish. */
export function subscribeLiveViewCount(slug: string, onStoreChange: SlugListener): () => void {
  if (!slug) return () => undefined;
  bindChannelOnce();
  const store = getStore();
  let set = store.slugListeners.get(slug);
  if (!set) {
    set = new Set();
    store.slugListeners.set(slug, set);
  }
  set.add(onStoreChange);
  return () => {
    const current = store.slugListeners.get(slug);
    if (!current) return;
    current.delete(onStoreChange);
    if (current.size === 0) store.slugListeners.delete(slug);
  };
}
