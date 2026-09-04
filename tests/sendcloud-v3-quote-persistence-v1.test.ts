/**
 * Sendcloud V3 shippingOptionCode persistence / recovery (checkout → post-payment → label).
 * No live announce. No hardcoded production mappings in implementation.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  applySelectedShippingQuotePayload,
  buildPersistedCheckoutQuote,
  buildSelectedShippingQuotePayload,
  confirmedV3PayloadFromSelectedQuote,
  parseConfirmedShippingQuotePayloadFromMetadata,
  resolveSelectedShippingQuoteForLabel,
  selectedSendcloudQuoteNeedsV3Discovery,
} from "@/lib/shipping/selected-shipping-quote-contract-v1";
import type { CheckoutCarrierQuote } from "@/lib/checkout/types";
import {
  buildShippingQuotePayload,
  isConfirmedSendcloudV3ShippingOptionCode,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { parcelSpecFromTier } from "@/lib/shipping/pricing/sendcloud-mappers";
import { clearSendcloudV3CatalogCacheForTests } from "@/lib/shipping/sendcloud/v3-catalog-cache-v1";
import { EVRI_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/evri-label-engine-certification-v1";
import { ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/royal-mail-label-engine-certification-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const sendcloudV3Request = vi.fn();

vi.mock("@/lib/shipping/sendcloud/client", () => ({
  sendcloudV3Request: (...args: unknown[]) => sendcloudV3Request(...args),
}));

const ROUTE = {
  fromCountryCode: "GB",
  toCountryCode: "GB",
  fromPostalCode: "WS29RD",
  toPostalCode: "E16AN",
  parcelTier: "small_parcel" as const,
};

function v2OnlyQuote(methodId: number, carrier: string): ShippingQuote {
  return {
    id: `sendcloud:${methodId}`,
    quoteRowId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    providerId: "sendcloud",
    carrier,
    serviceName: carrier,
    pricePence: 304,
    currency: "GBP",
    estimatedDays: { min: 2, max: 3 },
    v2MethodId: methodId,
    quoteApiVersion: "v2",
  };
}

function mockCatalog(methodId: number, code: string, contractId: string) {
  sendcloudV3Request.mockImplementation(async (path: string) => {
    if (String(path).includes("compat")) {
      return { data: { [String(methodId)]: code } };
    }
    return {
      data: [{ code, contract: { id: contractId } }],
    };
  });
}

describe("Sendcloud V3 quote persistence", () => {
  afterEach(() => {
    sendcloudV3Request.mockReset();
    clearSendcloudV3CatalogCacheForTests();
  });

  it("A — live checkout quote with confirmed V3 persists id + v2MethodId + shippingOptionCode", () => {
    const quote = applySelectedShippingQuotePayload(v2OnlyQuote(29632, "Royal Mail"), {
      externalQuoteId: "sendcloud:29632",
      v2MethodId: 29632,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
      contractId: "116816",
    });
    const payload = buildShippingQuotePayload(quote);
    expect(payload.externalQuoteId).toBe("sendcloud:29632");
    expect(payload.v2MethodId).toBe(29632);
    expect(payload.shippingOptionCode).toBe("royal_mailv2:tracked_48/size=s");
    expect(payload.contractId).toBe("116816");
    expect(selectedSendcloudQuoteNeedsV3Discovery(quote)).toBe(false);
  });

  it("B — existing sendcloud:N without V3 retains id, discovers, persists, becomes label-ready", async () => {
    const selectedId = "sendcloud:29632";
    const quote = v2OnlyQuote(29632, "Royal Mail");
    expect(quote.id).toBe(selectedId);
    expect(selectedSendcloudQuoteNeedsV3Discovery(quote)).toBe(true);
    mockCatalog(29632, "royal_mailv2:tracked_48/size=s", "116816");
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: 29632,
      route: ROUTE,
    });
    expect(meta?.shippingOptionCode).toBe("royal_mailv2:tracked_48/size=s");
    const enriched = applySelectedShippingQuotePayload(quote, {
      externalQuoteId: quote.id,
      v2MethodId: 29632,
      shippingOptionCode: meta!.shippingOptionCode,
      contractId: meta!.contractId,
    });
    expect(enriched.id).toBe(selectedId);
    expect(resolveSelectedShippingQuoteForLabel([enriched], selectedId)?.id).toBe(selectedId);
    expect(selectedSendcloudQuoteNeedsV3Discovery(enriched)).toBe(false);
    expect(buildShippingQuotePayload(enriched).shippingOptionCode).toBe(
      "royal_mailv2:tracked_48/size=s",
    );
  });

  it("C — label-time recovery: persist success + rehydrate → V3 gate would pass", async () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const recover = labelGen.slice(
      labelGen.indexOf("Recover confirmed V3 metadata"),
      labelGen.indexOf("Sendcloud production: fail closed when V3 shipping_option_code"),
    );
    expect(recover).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(recover).toContain("buildLiveCheckoutSendcloudV3Route");
    expect(recover).toContain("updateShippingQuotePayloadWithoutReplacing");
    expect(recover).toContain("resolveSelectedShippingQuoteForLabel");
    expect(recover).toContain("selectedSendcloudQuoteNeedsV3Discovery(again)");
    expect(recover).not.toContain("saveShippingQuotes");
    expect(recover).not.toContain("appendAndSelectShippingQuoteWithoutReplacing");

    mockCatalog(29632, "royal_mailv2:tracked_48/size=s", "116816");
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: 29632,
      route: ROUTE,
    });
    const recovered = applySelectedShippingQuotePayload(v2OnlyQuote(29632, "Royal Mail"), {
      externalQuoteId: "sendcloud:29632",
      v2MethodId: 29632,
      shippingOptionCode: meta!.shippingOptionCode,
    });
    expect(recovered.providerId === "sendcloud" && !recovered.shippingOptionCode).toBe(false);
  });

  it("D — no exact V3 counterpart → gate fails closed; announce is not reached", async () => {
    sendcloudV3Request.mockImplementation(async (path: string) => {
      if (String(path).includes("compat")) return { data: { "29632": null } };
      return { data: [] };
    });
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: 29632,
      route: ROUTE,
    });
    expect(meta).toBeNull();
    const quote = v2OnlyQuote(29632, "Royal Mail");
    expect(selectedSendcloudQuoteNeedsV3Discovery(quote)).toBe(true);

    const labelGen = read("lib/shipping/label-generation.server.ts");
    const gateIdx = labelGen.indexOf(
      "Sendcloud V3 shipping_option_code is required for label generation",
    );
    const announceIdx = labelGen.indexOf("await generateOrderShippingLabel");
    expect(gateIdx).toBeGreaterThan(0);
    expect(announceIdx).toBeGreaterThan(gateIdx);
    expect(labelGen).not.toContain("announceSendcloudShipmentV3");
  });

  it("E — Royal Mail uses generic V2 → V3 discovery (no hardcoded production code in catalog)", async () => {
    const rm = ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked48;
    mockCatalog(rm.v2MethodId, rm.shippingOptionCode, ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId);
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const catalog = read("lib/shipping/sendcloud/v3-catalog-v1.ts");
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(catalog).not.toContain("royal_mailv2:tracked_48/size=s");
    expect(postPayment).not.toContain("royal_mailv2:tracked_48/size=s");
    expect(postPayment).not.toMatch(/if \(carrier === ["']Royal Mail["']\)/);
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: rm.v2MethodId,
      route: ROUTE,
    });
    expect(meta?.shippingOptionCode).toBe(rm.shippingOptionCode);
  });

  it("F — Evri uses the SAME generic V2 → V3 discovery", async () => {
    const evri = EVRI_LABEL_ENGINE_CERTIFICATION_V1;
    mockCatalog(evri.canonicalV2MethodId, evri.canonicalShippingOptionCode, evri.canonicalContractId);
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const catalog = read("lib/shipping/sendcloud/v3-catalog-v1.ts");
    const postPayment = read("lib/orders/post-payment.server.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(catalog).not.toContain("if (carrier === \"Evri\")");
    expect(postPayment).not.toContain("if (carrier === \"Evri\")");
    expect(labelGen).not.toContain("if (carrier === \"Evri\")");
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: evri.canonicalV2MethodId,
      route: ROUTE,
    });
    expect(meta?.shippingOptionCode).toBe(evri.canonicalShippingOptionCode);
    const enriched = applySelectedShippingQuotePayload(
      v2OnlyQuote(evri.canonicalV2MethodId, "Evri"),
      {
        externalQuoteId: `sendcloud:${evri.canonicalV2MethodId}`,
        v2MethodId: evri.canonicalV2MethodId,
        shippingOptionCode: meta!.shippingOptionCode,
      },
    );
    expect(enriched.id).toBe(`sendcloud:${evri.canonicalV2MethodId}`);
  });

  it("G — no quotes[0], no carrier substitute, no fabricated / sendcloud:N V3 code", async () => {
    expect(isConfirmedSendcloudV3ShippingOptionCode("sendcloud:29632", 29632)).toBe(false);
    expect(isConfirmedSendcloudV3ShippingOptionCode("29632", 29632)).toBe(false);
    expect(isConfirmedSendcloudV3ShippingOptionCode("sendcloud:3650", 3650)).toBe(false);

    const selected = v2OnlyQuote(29632, "Royal Mail");
    const other = v2OnlyQuote(3650, "Evri");
    expect(resolveSelectedShippingQuoteForLabel([other, selected], selected.id)?.id).toBe(
      selected.id,
    );
    expect(resolveSelectedShippingQuoteForLabel([other], selected.id)).toBeNull();

    sendcloudV3Request.mockImplementation(async (path: string) => {
      if (String(path).includes("compat")) {
        return { data: { "29632": "royal_mailv2:tracked_48/size=s" } };
      }
      return {
        data: [{ code: "hermes_c2c_gb:a2a/pickup", contract: { id: "38704" } }],
      };
    });
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: 29632,
      route: ROUTE,
    });
    expect(meta).toBeNull();

    const persist = read("lib/orders/post-payment.server.ts");
    const v3Block = persist.slice(
      persist.indexOf("Identity resolve ≠ V3 persistence"),
      persist.indexOf("Internal shipment parcel row only"),
    );
    expect(v3Block).not.toContain("quotes[0]");
    expect(v3Block).not.toContain("selected_shipping_quote_id");
    expect(read("lib/shipping/sendcloud/v3-catalog-v1.ts")).not.toContain("quotes[0]");
  });

  it("H — selected quote ids remain unchanged by V3 payload update", () => {
    const store = read("lib/shipping/store.ts");
    const updateFn = store.slice(
      store.indexOf("Overlay confirmed V3 metadata onto the existing selected shipping_quotes row"),
      store.indexOf("export async function saveShippingLabel"),
    );
    expect(updateFn).toContain("Never changes selected_quote_id");
    expect(updateFn).toContain(".update({");
    expect(updateFn).toContain("quote_payload: buildShippingQuotePayload");
    expect(updateFn).not.toMatch(/selected_quote_id\s*:/);
    expect(updateFn).not.toContain("selected_shipping_quote_id");
    expect(updateFn).not.toContain(".insert(");

    const persist = read("lib/orders/post-payment.server.ts");
    const v3Block = persist.slice(
      persist.indexOf("Identity resolve ≠ V3 persistence"),
      persist.indexOf("Internal shipment parcel row only"),
    );
    expect(v3Block).toContain("updateShippingQuotePayloadWithoutReplacing");
    expect(v3Block).not.toContain("selected_shipping_quote_id");
    expect(v3Block).not.toContain("selected_quote_id");
    expect(v3Block).not.toContain("saveShippingQuotes");
  });

  it("I — recovery does not create a duplicate quote row", () => {
    const store = read("lib/shipping/store.ts");
    const updateFn = store.slice(
      store.indexOf("Overlay confirmed V3 metadata onto the existing selected shipping_quotes row"),
      store.indexOf("export async function saveShippingLabel"),
    );
    expect(updateFn).toContain("Never inserts a second quote");
    expect(updateFn).not.toContain(".insert(");
    expect(updateFn).not.toContain("appendAndSelectShippingQuoteWithoutReplacing");

    const labelGen = read("lib/shipping/label-generation.server.ts");
    const recover = labelGen.slice(
      labelGen.indexOf("Recover confirmed V3 metadata"),
      labelGen.indexOf("Sendcloud production: fail closed when V3 shipping_option_code"),
    );
    expect(recover).not.toContain("saveShippingQuotes");
    expect(recover).not.toContain("appendAndSelectShippingQuoteWithoutReplacing");
  });

  it("checkout-aligned route envelope matches live getQuotes parcel spec", async () => {
    const { buildLiveCheckoutSendcloudV3Route } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const spec = parcelSpecFromTier("small_parcel", 1);
    const route = buildLiveCheckoutSendcloudV3Route({
      fromCountryCode: "United Kingdom",
      toCountryCode: "GB",
      fromPostalCode: "WS2 9RD",
      toPostalCode: "E1 6AN",
      parcelTier: "small_parcel",
      weightKg: 1,
    });
    expect(route.fromCountryCode).toBe("GB");
    expect(route.toCountryCode).toBe("GB");
    expect(route.weightKg).toBe(spec.weightKg);
    expect(route.lengthCm).toBe(spec.lengthCm);
    expect(route.widthCm).toBe(spec.widthCm);
    expect(route.heightCm).toBe(spec.heightCm);
    expect(route.calculateQuotes).toBe(true);
  });

  it("A — live checkout quote with V3 persists shippingOptionCode and keeps sendcloud:N", () => {
    const live: CheckoutCarrierQuote = {
      id: "sendcloud:29632",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      price: 3.19,
      buyerPricePence: 319,
      eta: "2-3 days",
      v2MethodId: 29632,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
    };
    const persisted = buildPersistedCheckoutQuote({
      selectedQuoteId: live.id,
      carrier: "Royal Mail",
      pricePence: 304,
      payload: live,
    });
    const payload = buildShippingQuotePayload(persisted!);
    expect(persisted!.id).toBe("sendcloud:29632");
    expect(payload.externalQuoteId).toBe("sendcloud:29632");
    expect(payload.v2MethodId).toBe(29632);
    expect(payload.shippingOptionCode).toBe("royal_mailv2:tracked_48/size=s");
    expect(selectedSendcloudQuoteNeedsV3Discovery(persisted)).toBe(false);
  });

  it("B — live checkout quote with V3 + contractId persists both", () => {
    const live: CheckoutCarrierQuote = {
      id: "sendcloud:29632",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      price: 3.19,
      eta: "2-3 days",
      v2MethodId: 29632,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
      contractId: "116816",
    };
    const payload = buildSelectedShippingQuotePayload(live);
    expect(payload.shippingOptionCode).toBe("royal_mailv2:tracked_48/size=s");
    expect(payload.contractId).toBe("116816");
    expect(payload.externalQuoteId).toBe("sendcloud:29632");
  });

  it("C — live checkout quote without V3 invents nothing", () => {
    const live: CheckoutCarrierQuote = {
      id: "sendcloud:29632",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      price: 3.19,
      eta: "2-3 days",
      v2MethodId: 29632,
    };
    const persisted = buildPersistedCheckoutQuote({
      selectedQuoteId: live.id,
      carrier: "Royal Mail",
      pricePence: 304,
      payload: live,
    });
    const payload = buildShippingQuotePayload(persisted!);
    expect(payload.externalQuoteId).toBe("sendcloud:29632");
    expect(payload.shippingOptionCode).toBeUndefined();
    expect(confirmedV3PayloadFromSelectedQuote(live)).toBeNull();
    expect(selectedSendcloudQuoteNeedsV3Discovery(persisted)).toBe(true);
  });

  it("D — post-payment must not downgrade an already V3-enriched selected quote", () => {
    const persist = read("lib/orders/post-payment.server.ts");
    expect(persist).toContain("Never downgrade a V3-enriched selected quote");
    expect(persist).toContain("confirmedV3PayloadFromSelectedQuote");
    expect(persist).toContain("existingHasConfirmedV3");
    const existing = applySelectedShippingQuotePayload(v2OnlyQuote(29632, "Royal Mail"), {
      externalQuoteId: "sendcloud:29632",
      v2MethodId: 29632,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
      contractId: "116816",
    });
    const downgradeAttempt = buildPersistedCheckoutQuote({
      selectedQuoteId: existing.id,
      carrier: "Royal Mail",
      pricePence: 304,
      payload: existing,
    });
    expect(downgradeAttempt!.id).toBe("sendcloud:29632");
    expect(downgradeAttempt!.shippingOptionCode).toBe("royal_mailv2:tracked_48/size=s");
    expect(selectedSendcloudQuoteNeedsV3Discovery(downgradeAttempt)).toBe(false);
  });

  it("E — post-payment V2-only legacy quote keeps label-time recovery", () => {
    const persist = read("lib/orders/post-payment.server.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(persist).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(labelGen).toContain("Recover confirmed V3 metadata");
    expect(labelGen).toContain("discoverConfirmedV3MetadataForV2Method");
    const quote = v2OnlyQuote(29632, "Royal Mail");
    expect(selectedSendcloudQuoteNeedsV3Discovery(quote)).toBe(true);
  });

  it("F — persisted V3 quote makes the label V3 gate pass and announce reachable", () => {
    const quote = applySelectedShippingQuotePayload(v2OnlyQuote(29632, "Royal Mail"), {
      externalQuoteId: "sendcloud:29632",
      v2MethodId: 29632,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
    });
    expect(quote.providerId === "sendcloud" && !quote.shippingOptionCode).toBe(false);
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const gateIdx = labelGen.indexOf(
      "Sendcloud V3 shipping_option_code is required for label generation",
    );
    const announceIdx = labelGen.indexOf("await generateOrderShippingLabel");
    expect(gateIdx).toBeGreaterThan(0);
    expect(announceIdx).toBeGreaterThan(gateIdx);
  });

  it("G — Royal Mail uses the generic persist path", () => {
    const persist = read("lib/orders/post-payment.server.ts");
    const contract = read("lib/shipping/selected-shipping-quote-contract-v1.ts");
    expect(persist).not.toContain("royal_mailv2:tracked_48/size=s");
    expect(contract).not.toContain("royal_mailv2:tracked_48/size=s");
    expect(persist).not.toMatch(/if \(carrier === ["']Royal Mail["']\)/);
    const rm = ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked48;
    const persisted = buildPersistedCheckoutQuote({
      selectedQuoteId: `sendcloud:${rm.v2MethodId}`,
      carrier: "Royal Mail",
      pricePence: 304,
      payload: {
        id: `sendcloud:${rm.v2MethodId}`,
        carrier: "Royal Mail",
        serviceName: "Tracked 48",
        price: 3.19,
        eta: "2-3 days",
        v2MethodId: rm.v2MethodId,
        shippingOptionCode: rm.shippingOptionCode,
      },
    });
    expect(persisted!.id).toBe(`sendcloud:${rm.v2MethodId}`);
    expect(persisted!.shippingOptionCode).toBe(rm.shippingOptionCode);
  });

  it("H — Evri uses the same generic persist path", () => {
    const evri = EVRI_LABEL_ENGINE_CERTIFICATION_V1;
    const persist = read("lib/orders/post-payment.server.ts");
    expect(persist).not.toContain("if (carrier === \"Evri\")");
    const persisted = buildPersistedCheckoutQuote({
      selectedQuoteId: `sendcloud:${evri.canonicalV2MethodId}`,
      carrier: "Evri",
      pricePence: 304,
      payload: {
        id: `sendcloud:${evri.canonicalV2MethodId}`,
        carrier: "Evri",
        serviceName: "Evri",
        price: 3.19,
        eta: "1-2 days",
        v2MethodId: evri.canonicalV2MethodId,
        shippingOptionCode: evri.canonicalShippingOptionCode,
        contractId: evri.canonicalContractId,
      },
    });
    expect(persisted!.id).toBe(`sendcloud:${evri.canonicalV2MethodId}`);
    expect(persisted!.shippingOptionCode).toBe(evri.canonicalShippingOptionCode);
    expect(persisted!.contractId).toBe(evri.canonicalContractId);
  });

  it("I — sendcloud:N identity is unchanged by V3 persist helpers", () => {
    const id = "sendcloud:29632";
    const persisted = buildPersistedCheckoutQuote({
      selectedQuoteId: id,
      carrier: "Royal Mail",
      pricePence: 304,
      payload: {
        id,
        carrier: "Royal Mail",
        serviceName: "Tracked 48",
        price: 3.19,
        eta: "2-3 days",
        v2MethodId: 29632,
        shippingOptionCode: "royal_mailv2:tracked_48/size=s",
      },
    });
    expect(persisted!.id).toBe(id);
    expect(resolveSelectedShippingQuoteForLabel([persisted!], id)?.id).toBe(id);
    expect(parseConfirmedShippingQuotePayloadFromMetadata({
      selectedQuoteId: id,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
      contractId: "116816",
    })?.externalQuoteId).toBe(id);
  });

  it("J — quotes[0] fallback remains prohibited on persist + label paths", () => {
    const persist = read("lib/orders/post-payment.server.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const contract = read("lib/shipping/selected-shipping-quote-contract-v1.ts");
    const checkout = read("lib/orders/checkout.ts");
    const productionResolve = labelGen.slice(
      labelGen.indexOf("P8.5: resolve selected identity"),
      labelGen.indexOf("Sendcloud production: fail closed when V3 shipping_option_code"),
    );
    expect(persist).toContain("retainCheckoutSelectedQuoteId");
    expect(persist).toContain("resolveSelectedShippingQuoteForLabel");
    expect(productionResolve).toContain("never quotes[0]");
    expect(productionResolve).not.toMatch(/quotes\[0\]!/);
    expect(contract).toContain("never quotes[0]");
    expect(contract).not.toMatch(/quotes\[0\]!/);
    expect(checkout).toContain("buildSelectedShippingQuotePayload");
    expect(checkout).not.toMatch(/quotes\[0\]/);
    expect(resolveSelectedShippingQuoteForLabel(
      [v2OnlyQuote(3650, "Evri"), v2OnlyQuote(29632, "Royal Mail")],
      "sendcloud:29632",
    )?.id).toBe("sendcloud:29632");
    expect(isConfirmedSendcloudV3ShippingOptionCode("sendcloud:29632", 29632)).toBe(false);
  });

  it("post-payment + label-gen reuse existing catalog discovery only", () => {
    const persist = read("lib/orders/post-payment.server.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(persist).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(persist).toContain("buildLiveCheckoutSendcloudV3Route");
    expect(labelGen).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(labelGen).toContain("buildLiveCheckoutSendcloudV3Route");
    expect(persist).not.toContain("cancelSellerOrder");
    expect(labelGen).not.toContain("cancelSellerOrder");
  });
});
