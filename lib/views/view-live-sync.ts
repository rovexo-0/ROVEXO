/**
 * ROVEXO v1.0 — Product View Live Sync (Level 8 Production Lock)
 *
 * publishViewLive ONLY after verified DATABASE +1.
 * Surfaces subscribe to show the same products.views value — no F5.
 */

"use client";

type ViewLiveEvent = {
  slug: string;
  views: number;
  at: number;
};

type Listener = (event: ViewLiveEvent) => void;

const GLOBAL_KEY = "__rovexo_view_live_v1__" as const;

type ViewLiveStore = {
  listeners: Set<Listener>;
  counts: Map<string, number>;
  channel: BroadcastChannel | null | undefined;
  channelBound: boolean;
};

function getStore(): ViewLiveStore {
  const root = globalThis as typeof globalThis & { [GLOBAL_KEY]?: ViewLiveStore };
  if (!root[GLOBAL_KEY]) {
    root[GLOBAL_KEY] = {
      listeners: new Set(),
      counts: new Map(),
      channel: undefined,
      channelBound: false,
    };
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

export function subscribeViewLive(listener: Listener): () => void {
  bindChannelOnce();
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}
