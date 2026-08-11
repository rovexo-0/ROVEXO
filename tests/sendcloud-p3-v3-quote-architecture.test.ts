/**
 * Sendcloud P3 — V3 shipping quote architecture (focused contract tests).
 * No real shipment / parcel / announce / label API calls.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  mapSendcloudMethodToQuote,
  parseSendcloudQuoteId,
  encodeSendcloudQuoteId,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  buildShippingQuotePayload,
  isConfirmedSendcloudV3ShippingOptionCode,
  parseSendcloudV3AnnounceShipmentResult,
  parseSendcloudV3CompatMappings,
  resolveShippingQuoteApiVersion,
  shippingQuoteFromPayloadRow,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import {
  buildSendcloudV3CompatCacheKey,
  clearSendcloudV3CatalogCacheForTests,
  getSendcloudV3CatalogCacheSizeForTests,
  withSendcloudV3CatalogCache,
} from "@/lib/shipping/sendcloud/v3-catalog-cache-v1";
import { SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1 } from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";
import type { ShippingQuote } from "@/lib/shipping/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());

function method(overrides?: Partial<{ id: number; name: string; carrier: string }>) {
  return {
    id: overrides?.id ?? 42,
    name: overrides?.name ?? "Royal Mail Tracked 48",
    carrier: overrides?.carrier ?? "royal_mailv2",
    min_weight: "0.001",
    max_weight: "2.000",
    service_point_input: "none" as const,
    countries: [
      {
        id: 1,
        name: "United Kingdom",
        price: 2.38,
        iso_2: "GB",
        iso_3: "GBR",
        lead_time_hours: 48,
      },
    ],
  };
}

describe("P3 V3 quote identity — mapSendcloudMethodToQuote", () => {
  it("does NOT derive shippingOptionCode from V2 method.id", () => {
    const quote = mapSendcloudMethodToQuote(method({ id: 29631 }));
    expect(quote).not.toBeNull();
    expect(quote!.id).toBe("sendcloud:29631");
    expect(quote!.v2MethodId).toBe(29631);
    expect(quote!.shippingOptionCode).toBeUndefined();
    expect(quote!.quoteApiVersion).toBe("v2");
  });

  it("parseSendcloudQuoteId(sendcloud:29631) !== shippingOptionCode", () => {
    const methodId = parseSendcloudQuoteId("sendcloud:29631");
    expect(methodId).toBe(29631);
    expect(isConfirmedSendcloudV3ShippingOptionCode(String(methodId), methodId)).toBe(false);
    expect(isConfirmedSendcloudV3ShippingOptionCode("sendcloud:29631", methodId)).toBe(false);
    expect(isConfirmedSendcloudV3ShippingOptionCode("29631", methodId)).toBe(false);
  });

  it("ShippingQuote accepts shippingOptionCode / contractId / v2MethodId", () => {
    const quote = mapSendcloudMethodToQuote(method({ id: 100 }), {
      v2MethodId: 100,
      shippingOptionCode: "royal_mail:tracked_48",
      contractId: "517",
    });
    expect(quote).toMatchObject({
      id: "sendcloud:100",
      v2MethodId: 100,
      shippingOptionCode: "royal_mail:tracked_48",
      contractId: "517",
      quoteApiVersion: "v2+v3",
    });
  });

  it("rejects forged shippingOptionCode equal to method.id", () => {
    const quote = mapSendcloudMethodToQuote(method({ id: 29631 }), {
      v2MethodId: 29631,
      shippingOptionCode: "29631",
    });
    expect(quote!.shippingOptionCode).toBeUndefined();
    expect(quote!.quoteApiVersion).toBe("v2");
  });
});

describe("P3 quote_payload round-trip", () => {
  it("saveShippingQuotes payload builders preserve V3 metadata", () => {
    const quote: ShippingQuote = {
      id: "sendcloud:100",
      providerId: "sendcloud",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      pricePence: 238,
      currency: "GBP",
      estimatedDays: { min: 2, max: 3 },
      v2MethodId: 100,
      shippingOptionCode: "royal_mail:tracked_48",
      contractId: "99",
      quoteApiVersion: "v2+v3",
    };
    const payload = buildShippingQuotePayload(quote);
    expect(payload).toEqual({
      externalQuoteId: "sendcloud:100",
      v2MethodId: 100,
      shippingOptionCode: "royal_mail:tracked_48",
      contractId: "99",
      quoteApiVersion: "v2+v3",
    });

    const restored = shippingQuoteFromPayloadRow({
      id: "uuid-row",
      providerId: "sendcloud",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      pricePence: 238,
      currency: "GBP",
      estimatedDaysMin: 2,
      estimatedDaysMax: 3,
      recommended: null,
      expiresAt: null,
      quotePayload: payload,
    });
    expect(restored.shippingOptionCode).toBe("royal_mail:tracked_48");
    expect(restored.contractId).toBe("99");
    expect(restored.v2MethodId).toBe(100);
    expect(restored.quoteApiVersion).toBe("v2+v3");
    expect(restored.id).toBe("sendcloud:100");
  });

  it("quoteApiVersion is correct for v2-only and v2+v3", () => {
    expect(resolveShippingQuoteApiVersion({ v2MethodId: 1 })).toBe("v2");
    expect(
      resolveShippingQuoteApiVersion({
        v2MethodId: 1,
        shippingOptionCode: "postnl:standard",
      }),
    ).toBe("v2+v3");
    expect(
      resolveShippingQuoteApiVersion({
        shippingOptionCode: "postnl:standard",
      }),
    ).toBe("v3");
  });
});

describe("P3 V3 catalog / compat mapping", () => {
  it("returns confirmed code when fixture contains one", () => {
    const map = parseSendcloudV3CompatMappings(
      { data: { "42": "royal_mail:tracked_48", "99": "postnl:standard" } },
      [42, 99],
    );
    expect(map.get(42)?.result).toBe("MAPPING_CONFIRMED");
    expect(map.get(42)?.shippingOptionCode).toBe("royal_mail:tracked_48");
    expect(map.get(99)?.shippingOptionCode).toBe("postnl:standard");
  });

  it("returns no code when Sendcloud returns null", () => {
    const map = parseSendcloudV3CompatMappings({ data: { "29631": null } }, [29631]);
    expect(map.get(29631)?.result).toBe("NO_V3_COUNTERPART");
    expect(map.get(29631)?.shippingOptionCode).toBeNull();
  });

  it("29631 remains NO_V3_COUNTERPART when null / numeric / sendcloud:N", () => {
    for (const value of [null, "null", "29631", "sendcloud:29631"]) {
      const map = parseSendcloudV3CompatMappings({ data: { "29631": value } }, [29631]);
      expect(map.get(29631)?.result).toBe("NO_V3_COUNTERPART");
      expect(map.get(29631)?.shippingOptionCode).toBeNull();
    }
    expect(SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1.methodId).toBe(29631);
  });

  it("does not auto-select closest/partial Royal Mail substitutes from compat null", () => {
    const map = parseSendcloudV3CompatMappings({ data: { "29631": null } }, [29631]);
    expect(map.get(29631)?.shippingOptionCode).toBeNull();
    // No Tracked 24 / Tracked 48 without Large Letter invented here.
    expect(String(map.get(29631)?.shippingOptionCode ?? "")).not.toMatch(/tracked_24/i);
  });
});

describe("P3 V3 catalog cache", () => {
  afterEach(() => {
    clearSendcloudV3CatalogCacheForTests();
  });

  it("cache hit prevents duplicate V3 request", async () => {
    const fetcher = vi.fn(async () => ({ ok: true }));
    const key = buildSendcloudV3CompatCacheKey([1, 2]);
    await withSendcloudV3CatalogCache(key, fetcher);
    await withSendcloudV3CatalogCache(key, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getSendcloudV3CatalogCacheSizeForTests()).toBe(1);
  });

  it("concurrent identical lookup does not create unnecessary duplicate calls", async () => {
    let resolve!: (v: number) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<number>((r) => {
          resolve = r;
        }),
    );
    const key = buildSendcloudV3CompatCacheKey([7]);
    const p1 = withSendcloudV3CatalogCache(key, fetcher);
    const p2 = withSendcloudV3CatalogCache(key, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    resolve(7);
    await expect(Promise.all([p1, p2])).resolves.toEqual([7, 7]);
  });
});

describe("P3 checkout / legacy / label path contracts (source)", () => {
  it("checkout remains compatible with sendcloud:N encode/parse", () => {
    expect(encodeSendcloudQuoteId(29631)).toBe("sendcloud:29631");
    expect(parseSendcloudQuoteId("sendcloud:29631")).toBe(29631);
    expect(parseSendcloudQuoteId("sendcloud:42")).toBe(42);
  });

  it("label path fails closed when shippingOptionCode is missing (service source)", () => {
    const service = readFileSync(join(ROOT, "lib/shipping/sendcloud/service.ts"), "utf8");
    expect(service).toContain("isConfirmedSendcloudV3ShippingOptionCode");
    expect(service).toContain("NO_V3_SHIPPING_OPTION_CODE");
    expect(service).toContain("announceSendcloudShipmentV3");
    expect(service).not.toMatch(/createSendcloudParcel\(/);
  });

  it("label path never calls V2 /parcels from generateLabel", () => {
    const service = readFileSync(join(ROOT, "lib/shipping/sendcloud/service.ts"), "utf8");
    expect(service).not.toContain('"/parcels"');
    expect(service).not.toContain("buildSendcloudParcelPayload");
  });

  it("V3 label path consumes persisted shippingOptionCode", () => {
    const adapter = readFileSync(join(ROOT, "lib/shipping/pricing/sendcloud-adapter.ts"), "utf8");
    const labelGen = readFileSync(join(ROOT, "lib/shipping/label-generation.server.ts"), "utf8");
    expect(adapter).toContain("shippingOptionCode: request.shippingOptionCode");
    expect(labelGen).toContain("shippingOptionCode: selectedQuote?.shippingOptionCode");
    expect(labelGen).toContain("shipping_option_code is required");
  });

  it("existing ready label/tracking is reused (idempotency gate)", () => {
    const labelGen = readFileSync(join(ROOT, "lib/shipping/label-generation.server.ts"), "utf8");
    expect(labelGen).toContain('parcel?.label?.status === "ready"');
    expect(labelGen).toContain("idempotent: true");
  });

  it("existing provider parcel id prevents duplicate creation", () => {
    const service = readFileSync(join(ROOT, "lib/shipping/sendcloud/service.ts"), "utf8");
    expect(service).toContain("existingProviderParcelId");
    expect(service).toContain("reusedExisting: true");
  });

  it("HTTP 409 follows safe reuse path", () => {
    const client = readFileSync(join(ROOT, "lib/shipping/sendcloud/client.ts"), "utf8");
    expect(client).toContain("statusCode === 409");
    expect(client).toContain("reusedExisting: true");
    const parsed = parseSendcloudV3AnnounceShipmentResult(
      {
        data: {
          id: "ship-1",
          parcels: [
            {
              id: 383707309,
              tracking_number: "3SYZXG8498635",
              documents: [
                {
                  type: "label",
                  link: "https://panel.sendcloud.sc/api/v3/parcels/383707309/documents/label",
                },
              ],
            },
          ],
        },
      },
      { reusedExisting: true },
    );
    expect(parsed.reusedExisting).toBe(true);
    expect(parsed.trackingNumber).toBe("3SYZXG8498635");
    expect(parsed.parcelId).toBe(383707309);
  });

  it("Service Points behaviour remains gated in getQuotes", () => {
    const service = readFileSync(join(ROOT, "lib/shipping/sendcloud/service.ts"), "utf8");
    expect(service).toContain('method.service_point_input === "required"');
    expect(service).toContain("isServicePointEngineEnabled");
  });

  it("store persists quoteApiVersion + V3 fields", () => {
    const store = readFileSync(join(ROOT, "lib/shipping/store.ts"), "utf8");
    expect(store).toContain("buildShippingQuotePayload");
    expect(store).toContain("shippingQuoteFromPayloadRow");
  });

  it("diagnostic remains thin and does not own cache", () => {
    const route = readFileSync(
      join(ROOT, "app/api/super-admin/shipping/diagnostic-v3-option-29631/route.ts"),
      "utf8",
    );
    expect(route).toContain("discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic");
    expect(route).not.toContain("withSendcloudV3CatalogCache");
    expect(route).not.toContain("/shipments/announce");
    expect(route).not.toContain("/parcels");
  });

  it("demo adapter path unchanged (no V3 announce dependency)", () => {
    const demo = readFileSync(join(ROOT, "lib/shipping/pricing/demo-adapter.ts"), "utf8");
    expect(demo).not.toContain("announceSendcloudShipmentV3");
    expect(demo).not.toContain("shippingOptionCode");
  });
});

describe("P3 catalog module singularity", () => {
  it("ONE canonical catalog implementation exists under lib/shipping/sendcloud/", () => {
    const catalog = readFileSync(join(ROOT, "lib/shipping/sendcloud/v3-catalog-v1.ts"), "utf8");
    expect(catalog).toContain("fetchSendcloudV3CompatMappingsForMethodIds");
    expect(catalog).toContain("fetchSendcloudV3ShippingOptionsCatalog");
    expect(catalog).toContain("resolveSendcloudV3MetadataForMethods");
    expect(catalog).not.toMatch(/\bRVXC75CA5BB\b/);
    expect(catalog).not.toContain("super-admin");
  });
});
