import "server-only";

export type ApiFetchOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retries?: number;
};

export class ConnectorApiError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status: number, retryable = false) {
    super(message);
    this.name = "ConnectorApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function parseRetryAfterMs(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) return 1_500;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) ? seconds * 1_000 : 1_500;
}

export async function apiFetchWithRetry(
  url: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const retries = options.retries ?? 3;
  let attempt = 0;

  while (attempt <= retries) {
    const response = await fetch(url, {
      headers: options.headers,
      signal: options.signal ?? AbortSignal.timeout(20_000),
    });

    if (response.ok || !isRetryableStatus(response.status) || attempt === retries) {
      return response;
    }

    await new Promise((resolve) => setTimeout(resolve, parseRetryAfterMs(response)));
    attempt += 1;
  }

  throw new ConnectorApiError("Request failed after retries.", 500, true);
}

export function parseLinkHeader(link: string | null): Record<string, string> {
  if (!link) return {};
  const links: Record<string, string> = {};
  for (const part of link.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) links[match[2]!] = match[1]!;
  }
  return links;
}
