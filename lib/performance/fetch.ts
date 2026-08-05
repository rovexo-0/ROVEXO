type FetchInit = RequestInit & { dedupeKey?: string };

const inflight = new Map<string, AbortController>();

/** Concurrent GET coalescing — many callers share one Promise (Saved-style). */
const shareInflight = new Map<string, Promise<unknown>>();
const shareCache = new Map<string, { expires: number; value: unknown }>();

export function abortInflightFetches(prefix?: string): void {
  for (const [key, controller] of inflight.entries()) {
    if (!prefix || key.startsWith(prefix)) {
      controller.abort();
      inflight.delete(key);
    }
  }
}

/**
 * Abort-coalesce: latest request wins (typing / search).
 * Does NOT share one Promise across callers.
 */
export async function fetchDeduped(input: RequestInfo | URL, init: FetchInit = {}): Promise<Response> {
  const { dedupeKey, ...requestInit } = init;
  const key =
    dedupeKey ??
    `${requestInit.method ?? "GET"}:${typeof input === "string" ? input : input.toString()}`;

  inflight.get(key)?.abort();

  const controller = new AbortController();
  inflight.set(key, controller);

  try {
    return await fetch(input, {
      ...requestInit,
      signal: controller.signal,
    });
  } finally {
    if (inflight.get(key) === controller) {
      inflight.delete(key);
    }
  }
}

export type ShareInflightOptions = {
  /**
   * Soft TTL for remount / Strict Mode (ms).
   * `0` = inflight-only (no soft cache) — required for wallet / checkout / bundle.
   * Default 750 for safe catalog/list remounts.
   */
  ttlMs?: number;
};

/**
 * Share any async work by key — concurrent callers await the same Promise.
 * Prefer this when the shared result is not plain JSON GET (e.g. 401 handling).
 */
export function shareInflightRequest<T>(
  key: string,
  factory: () => Promise<T>,
  options: ShareInflightOptions = {},
): Promise<T> {
  const ttlMs = options.ttlMs ?? 750;
  const cached = shareCache.get(key);
  if (ttlMs > 0 && cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.value as T);
  }

  const existing = shareInflight.get(key);
  if (existing) return existing as Promise<T>;

  const tracked = (async () => {
    const value = await factory();
    if (ttlMs > 0) {
      shareCache.set(key, { expires: Date.now() + ttlMs, value });
    }
    return value;
  })().finally(() => {
    if (shareInflight.get(key) === tracked) {
      shareInflight.delete(key);
    }
  });

  shareInflight.set(key, tracked);
  return tracked as Promise<T>;
}

export type ShareInflightJsonOptions = ShareInflightOptions & {
  init?: RequestInit;
};

/**
 * Share-inflight JSON GET — identical concurrent mounts reuse one network round-trip.
 * Use for list/hydrate endpoints (messages, notifications, orders, snapshot).
 * Prefer this over fetchDeduped for mount waterfalls.
 */
export function shareInflightJson<T>(
  key: string,
  input: RequestInfo | URL,
  options: ShareInflightJsonOptions = {},
): Promise<T> {
  return shareInflightRequest(
    key,
    async () => {
      const response = await fetch(input, {
        cache: "no-store",
        ...options.init,
      });
      if (!response.ok) {
        throw new Error(`shareInflightJson failed: ${key} ${response.status}`);
      }
      return (await response.json()) as T;
    },
    { ttlMs: options.ttlMs },
  );
}

export function invalidateShareInflight(prefix?: string): void {
  for (const key of [...shareInflight.keys()]) {
    if (!prefix || key.startsWith(prefix)) shareInflight.delete(key);
  }
  for (const key of [...shareCache.keys()]) {
    if (!prefix || key.startsWith(prefix)) shareCache.delete(key);
  }
}

export function createScopedFetcher(scope: string) {
  let scopeController: AbortController | null = null;

  return {
    fetch(input: RequestInfo | URL, init: RequestInit = {}) {
      scopeController?.abort();
      scopeController = new AbortController();
      const signal = scopeController.signal;
      return fetch(input, { ...init, signal });
    },
    abort() {
      scopeController?.abort();
      scopeController = null;
      abortInflightFetches(scope);
    },
  };
}
