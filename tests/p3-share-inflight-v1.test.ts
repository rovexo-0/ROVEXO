import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  shareInflightRequest,
  shareInflightJson,
  invalidateShareInflight,
} from "@/lib/performance/fetch";

describe("P3 shareInflightRequest / shareInflightJson", () => {
  beforeEach(() => {
    invalidateShareInflight();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    invalidateShareInflight();
  });

  it("coalesces concurrent identical work into one factory call", async () => {
    let calls = 0;
    const factory = () => {
      calls += 1;
      return new Promise<number>((resolve) => {
        setTimeout(() => resolve(42), 20);
      });
    };

    const [a, b, c] = await Promise.all([
      shareInflightRequest("test:coalesce", factory, { ttlMs: 0 }),
      shareInflightRequest("test:coalesce", factory, { ttlMs: 0 }),
      shareInflightRequest("test:coalesce", factory, { ttlMs: 0 }),
    ]);

    expect(calls).toBe(1);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(c).toBe(42);
  });

  it("ttlMs:0 does not soft-cache after completion", async () => {
    let calls = 0;
    const factory = async () => {
      calls += 1;
      return calls;
    };

    await shareInflightRequest("test:no-ttl", factory, { ttlMs: 0 });
    await shareInflightRequest("test:no-ttl", factory, { ttlMs: 0 });

    expect(calls).toBe(2);
  });

  it("shareInflightJson soft TTL serves remount within window", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await shareInflightJson("test:json-ttl", "/api/test", { ttlMs: 5_000 });
    await shareInflightJson("test:json-ttl", "/api/test", { ttlMs: 5_000 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
