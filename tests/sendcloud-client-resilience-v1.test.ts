/**
 * SENDCLOUD-FUNCTIONAL-HARDENING-V1 — Phase 5 client resilience (AbortSignal timeout).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendcloudRequest resilience", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  async function loadClient() {
    process.env.SENDCLOUD_PUBLIC_KEY = "pub";
    process.env.SENDCLOUD_SECRET_KEY = "sec";
    return import("@/lib/shipping/sendcloud/client");
  }

  it("successful request returns JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ shipping_methods: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { listSendcloudShippingMethods } = await loadClient();
    const methods = await listSendcloudShippingMethods({
      toCountry: "GB",
      toPostalCode: "SW1A 1AA",
      fromPostalCode: "M1 1AE",
    });
    expect(methods).toEqual([]);
  });

  it("timeout aborts underlying fetch and maps to SendcloudError timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      }),
    );

    const { sendcloudRequest } = await loadClient();
    const pending = sendcloudRequest("/shipping_methods", { method: "GET", timeoutMs: 50 });
    const expectation = expect(pending).rejects.toMatchObject({
      name: "SendcloudError",
      code: "timeout",
    });
    await vi.advanceTimersByTimeAsync(60);
    await expectation;
  });

  it("caller abort maps to network_error", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      }),
    );

    const { sendcloudRequest } = await loadClient();
    const pending = sendcloudRequest("/shipping_methods", {
      method: "GET",
      signal: controller.signal,
      timeoutMs: 30_000,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "network_error" });
  });

  it("network failure maps to network_error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    const { sendcloudRequest } = await loadClient();
    await expect(sendcloudRequest("/shipping_methods", { method: "GET" })).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it.each([
    [401, "Unauthorized"],
    [403, "Forbidden"],
    [400, "Bad request"],
    [500, "Server error"],
  ])("HTTP %s maps to api_error with statusCode", async (status, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message } }), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { sendcloudRequest } = await loadClient();
    await expect(sendcloudRequest("/shipping_methods", { method: "GET" })).rejects.toMatchObject({
      code: "api_error",
      statusCode: status,
      message,
    });
  });

  it("legacy createSendcloudParcel is removed; cancel POST must not enable retrySafeGet", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("lib/shipping/sendcloud/client.ts", "utf8");
    expect(src).not.toMatch(/export async function createSendcloudParcel\b/);
    const start = src.indexOf("export async function cancelSendcloudParcel");
    const end = src.indexOf("const v3AnnounceInflight");
    const cancelBlock = src.slice(start, end > start ? end : undefined);
    expect(cancelBlock).toContain('method: "POST"');
    expect(cancelBlock).not.toMatch(/retrySafeGet:\s*true/);
  });
});
