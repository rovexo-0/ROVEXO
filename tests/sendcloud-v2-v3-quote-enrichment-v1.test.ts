/**
 * V2-only selected quote → existing Sendcloud V3 catalog enrichment.
 * No live announce. No hardcoded production carrier IDs.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  applySelectedShippingQuotePayload,
  resolveSelectedShippingQuoteForLabel,
  selectedSendcloudQuoteNeedsV3Discovery,
} from "@/lib/shipping/selected-shipping-quote-contract-v1";
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

describe("sendcloud V2 → V3 selected-quote enrichment", () => {
  afterEach(() => {
    sendcloudV3Request.mockReset();
    clearSendcloudV3CatalogCacheForTests();
  });

  it("A — quote already has shippingOptionCode → no V3 discovery needed", () => {
    const quote = applySelectedShippingQuotePayload(v2OnlyQuote(29632, "Royal Mail"), {
      externalQuoteId: "sendcloud:29632",
      v2MethodId: 29632,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
    });
    expect(selectedSendcloudQuoteNeedsV3Discovery(quote)).toBe(false);
    expect(sendcloudV3Request).not.toHaveBeenCalled();
  });

  it("B — sendcloud:N without shippingOptionCode → discovery runs", async () => {
    const quote = v2OnlyQuote(29632, "Royal Mail");
    expect(selectedSendcloudQuoteNeedsV3Discovery(quote)).toBe(true);
    mockCatalog(29632, "royal_mailv2:tracked_48/size=s", "116816");
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: 29632,
      route: ROUTE,
    });
    expect(sendcloudV3Request).toHaveBeenCalled();
    expect(sendcloudV3Request.mock.calls.some(([path]) => String(path).includes("compat"))).toBe(
      true,
    );
  });

  it("C — V3 counterpart found → enrich + resolver keeps identity", async () => {
    const quote = v2OnlyQuote(29632, "Royal Mail");
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
    const resolved = resolveSelectedShippingQuoteForLabel([enriched], quote.id);
    expect(resolved?.id).toBe(quote.id);
    expect(resolved?.shippingOptionCode).toBe("royal_mailv2:tracked_48/size=s");
    expect(selectedSendcloudQuoteNeedsV3Discovery(enriched)).toBe(false);
  });

  it("D — V3 counterpart not found → fail closed, no invent", async () => {
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
    expect(selectedSendcloudQuoteNeedsV3Discovery(v2OnlyQuote(29632, "Royal Mail"))).toBe(true);
  });

  it("E — Royal Mail V2-only quote uses generic discovery (no hardcoded production ID)", async () => {
    const rm = ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked48;
    mockCatalog(rm.v2MethodId, rm.shippingOptionCode, ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId);
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const catalog = read("lib/shipping/sendcloud/v3-catalog-v1.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(catalog).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(catalog).not.toContain("royal_mailv2:tracked_48/size=s");
    expect(labelGen).not.toContain("royal_mailv2:tracked_48/size=s");
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: rm.v2MethodId,
      route: ROUTE,
    });
    expect(meta?.shippingOptionCode).toBe(rm.shippingOptionCode);
  });

  it("F — Evri V2-only quote uses the same generic discovery", async () => {
    const evri = EVRI_LABEL_ENGINE_CERTIFICATION_V1;
    mockCatalog(evri.canonicalV2MethodId, evri.canonicalShippingOptionCode, evri.canonicalContractId);
    const { discoverConfirmedV3MetadataForV2Method } = await import(
      "@/lib/shipping/sendcloud/v3-catalog-v1"
    );
    const catalog = read("lib/shipping/sendcloud/v3-catalog-v1.ts");
    expect(catalog).not.toContain("if (carrier === \"Evri\")");
    expect(catalog).not.toContain("if (carrier === \"Royal Mail\")");
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: evri.canonicalV2MethodId,
      route: ROUTE,
    });
    expect(meta?.shippingOptionCode).toBe(evri.canonicalShippingOptionCode);
    const quote = v2OnlyQuote(evri.canonicalV2MethodId, "Evri");
    const enriched = applySelectedShippingQuotePayload(quote, {
      externalQuoteId: quote.id,
      v2MethodId: evri.canonicalV2MethodId,
      shippingOptionCode: meta!.shippingOptionCode,
    });
    expect(resolveSelectedShippingQuoteForLabel([enriched], quote.id)?.id).toBe(quote.id);
  });

  it("G/H/I — selected identity unchanged; no first-list fallback; no carrier substitute", () => {
    const selected = v2OnlyQuote(29632, "Royal Mail");
    const other: ShippingQuote = {
      ...v2OnlyQuote(3650, "Evri"),
      id: "sendcloud:3650",
      quoteRowId: "ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb",
    };
    expect(resolveSelectedShippingQuoteForLabel([other, selected], selected.id)?.id).toBe(
      selected.id,
    );
    expect(resolveSelectedShippingQuoteForLabel([other], selected.id)).toBeNull();
    const resolveSrc = read("lib/shipping/selected-shipping-quote-contract-v1.ts");
    const fn = resolveSrc.slice(
      resolveSrc.indexOf("export function resolveSelectedShippingQuoteForLabel"),
      resolveSrc.indexOf("export function selectedSendcloudQuoteNeedsV3Discovery"),
    );
    expect(fn).not.toContain("quotes[0]");
    expect(read("lib/shipping/label-generation.server.ts")).not.toMatch(
      /if \(carrier === ["']Evri["']\)|if \(carrier === ["']Royal Mail["']\)/,
    );
  });

  it("J/K — enrichment updates existing quote_payload; already-enriched is idempotent", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const store = read("lib/shipping/store.ts");
    expect(labelGen).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(labelGen).toContain("updateShippingQuotePayloadWithoutReplacing");
    expect(labelGen).toContain("selectedSendcloudQuoteNeedsV3Discovery");
    expect(store).toContain("updateShippingQuotePayloadWithoutReplacing");
    expect(store).toContain("Never inserts a second quote");
    const enrichBlock = labelGen.slice(
      labelGen.indexOf("Recover confirmed V3 metadata"),
      labelGen.indexOf("Sendcloud production: fail closed when V3 shipping_option_code"),
    );
    expect(enrichBlock).not.toContain("saveShippingQuotes");
    expect(enrichBlock).not.toContain("appendAndSelectShippingQuoteWithoutReplacing");
    const already = applySelectedShippingQuotePayload(v2OnlyQuote(29632, "Royal Mail"), {
      externalQuoteId: "sendcloud:29632",
      v2MethodId: 29632,
      shippingOptionCode: "royal_mailv2:tracked_48/size=s",
    });
    expect(selectedSendcloudQuoteNeedsV3Discovery(already)).toBe(false);
  });

  it("L/M/N — Seller Cancel / wallet / refund / messages files unchanged by this path", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).not.toContain("cancelSellerOrder");
    expect(labelGen).not.toContain("lib/wallet/sales");
    expect(labelGen).not.toContain("refund-lifecycle");
    expect(labelGen).not.toContain("InboxPage");
  });
});
