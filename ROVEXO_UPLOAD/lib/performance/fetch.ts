type FetchInit = RequestInit & { dedupeKey?: string };

const inflight = new Map<string, AbortController>();

export function abortInflightFetches(prefix?: string): void {
  for (const [key, controller] of inflight.entries()) {
    if (!prefix || key.startsWith(prefix)) {
      controller.abort();
      inflight.delete(key);
    }
  }
}

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
