/**
 * Client-level: V3 shipping-options discovery targets official endpoint with persisted params.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const getShippingRecord = vi.fn();

vi.mock("@/lib/shipping/store", () => ({
  getShippingRecord: (...args: unknown[]) => getShippingRecord(...args),
}));

describe("discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic request targeting", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("POSTs shipping-options to https://panel.sendcloud.sc/api/v3/shipping-options", async () => {
    process.env.SENDCLOUD_PUBLIC_KEY = "pub-test";
    process.env.SENDCLOUD_SECRET_KEY = "sec-test";
    delete process.env.SENDCLOUD_V3_BASE_URL;

    getShippingRecord.mockResolvedValue({
      id: "ship-1",
      orderId: "50a8b313-1fd3-4104-8af5-725a84a3350e",
      parcelTier: "small_parcel",
      status: "preparing",
      carrier: null,
      trackingNumber: null,
      collectionAddress: {
        fullName: "Seller",
        line1: "1 High Street",
        city: "London",
        postcode: "SW1A 1AA",
        country: "GB",
      },
      deliveryAddress: {
        fullName: "Buyer",
        line1: "2 Queen Street",
        city: "Manchester",
        postcode: "M1 1AE",
        country: "United Kingdom",
      },
      pricing: {
        quotes: [
          {
            id: "sendcloud:29631",
            providerId: "sendcloud",
            carrier: "royal_mail",
            serviceName: "Royal Mail Tracked 48 - Large Letter",
            pricePence: 238,
            currency: "GBP",
            estimatedDays: { min: 2, max: 3 },
          },
        ],
        selectedQuoteId: "sendcloud:29631",
        currency: "GBP",
        providerAvailable: true,
      },
      label: null,
      parcels: [],
      trackingEvents: [],
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              code: "royal_mail:tracked_48:large_letter",
              name: "Royal Mail Tracked 48 - Large Letter",
              carrier: { code: "royal_mail", name: "Royal Mail" },
              product: { name: "Royal Mail Tracked 48 - Large Letter" },
              contract: { id: "99" },
              quotes: [{ price: { value: "2.38", currency: "GBP" } }],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic } = await import(
      "@/lib/shipping/sendcloud/client"
    );
    const result = await discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic();

    expect(getShippingRecord).toHaveBeenCalledWith("50a8b313-1fd3-4104-8af5-725a84a3350e");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://panel.sendcloud.sc/api/v3/shipping-options");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.from_country_code).toBe("GB");
    expect(body.to_country_code).toBe("GB");
    expect(body.from_postal_code).toBe("SW1A1AA");
    expect(body.to_postal_code).toBe("M11AE");
    expect(body.carrier_code).toBe("royal_mail");
    expect(body.calculate_quotes).toBe(true);
    expect(Array.isArray(body.parcels)).toBe(true);
    expect(result.requestUrlPath).toBe("/shipping-options");
    expect(result.forensic.mappingConfirmed).toBe(true);
    expect(result.forensic.result).toBe("MAPPING_CONFIRMED");
    expect(result.forensic.shippingOptionCode).toBe("royal_mail:tracked_48:large_letter");
    expect(result.forensic.contractId).toBe("99");
    expect(result.forensic.exactMatchCount).toBe(1);
    expect(result.forensic.candidateCount).toBe(1);
    expect(result).not.toHaveProperty("raw");
    expect(JSON.stringify(result.forensic).toLowerCase()).not.toContain("authorization");
    expect(JSON.stringify(result.forensic).toLowerCase()).not.toContain("basic");
    expect(JSON.stringify(result.requestBody).toLowerCase()).not.toContain("authorization");
  });
});
