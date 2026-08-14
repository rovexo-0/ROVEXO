/**
 * SENDCLOUD-FUNCTIONAL-HARDENING-V1 — Phase 4 shipping rates / quote mapping.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { mapSendcloudMethodToQuote } from "@/lib/shipping/pricing/sendcloud-mappers";
import { resolveListingParcelTier } from "@/lib/shipping/parcels";
import type { SendcloudShippingMethod } from "@/lib/shipping/sendcloud/types";

function method(overrides: Partial<SendcloudShippingMethod> = {}): SendcloudShippingMethod {
  return {
    id: 100,
    name: "Royal Mail Tracked 48",
    carrier: "royal_mail",
    min_weight: "0.001",
    max_weight: "20.000",
    service_point_input: "none",
    countries: [
      {
        id: 1,
        name: "United Kingdom",
        price: 3.49,
        iso_2: "GB",
        iso_3: "GBR",
        lead_time_hours: 48,
      },
    ],
    ...overrides,
  };
}

describe("shipping quote mapping", () => {
  it("maps Sendcloud GB price to GBP pence without fabricating VAT", () => {
    const quote = mapSendcloudMethodToQuote(method());
    expect(quote).not.toBeNull();
    expect(quote!.currency).toBe("GBP");
    expect(quote!.pricePence).toBe(349);
    expect(quote).not.toHaveProperty("vatPence");
  });

  it("rejects negative / missing prices", () => {
    expect(
      mapSendcloudMethodToQuote(
        method({
          countries: [
            {
              id: 1,
              name: "United Kingdom",
              price: Number.NaN,
              iso_2: "GB",
              iso_3: "GBR",
              lead_time_hours: 24,
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it("resolves real listing parcel tiers (legacy + canonical) and fail-closes missing", () => {
    expect(resolveListingParcelTier("large")).toBe("large_parcel");
    expect(resolveListingParcelTier("medium_parcel")).toBe("medium_parcel");
    expect(resolveListingParcelTier(null)).toBeNull();
    expect(resolveListingParcelTier("unknown-size")).toBeNull();
  });

  it("checkout quotes no longer hardcode parcelTier = small_parcel only", () => {
    const src = readFileSync("lib/checkout/shipping-quotes.server.ts", "utf8");
    expect(src).toContain("resolveListingParcelTier");
    expect(src).toContain("parcel_size");
    expect(src).not.toMatch(/parcelTier:\s*"small_parcel"/);
  });

  it("documents that /shipping_methods does not accept weight/dimensions query params", () => {
    const client = readFileSync("lib/shipping/sendcloud/client.ts", "utf8");
    expect(client).toMatch(/Weight\/dimensions are NOT request parameters/i);
    const methodsFn = client.slice(
      client.indexOf("export async function listSendcloudShippingMethods"),
      client.indexOf("export type SendcloudParcelCreatePayload"),
    );
    expect(methodsFn).toContain("to_postal_code");
    expect(methodsFn).not.toMatch(/\bweight\b/);
    expect(methodsFn).not.toMatch(/\blength\b/);
  });
});
