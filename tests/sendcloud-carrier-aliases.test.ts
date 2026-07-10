import { describe, expect, it } from "vitest";
import { allCarrierNames } from "@/lib/shipping/carriers";
import { mapSendcloudMethodCarrier, mapSendcloudMethodToQuote } from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  mapSendcloudCarrierToUk,
  normalizeSendcloudCarrierKey,
} from "@/lib/shipping/sendcloud/carrier-aliases";

/** Carrier codes observed from live Sendcloud UK /shipping_methods responses. */
const LIVE_SENDCLOUD_UK_CARRIER_CODES = [
  "dpd_gb",
  "fedex",
  "hermes_c2c_gb",
  "inpost_gb",
  "royal_mailv2",
  "sendcloud",
] as const;

describe("Sendcloud UK carrier aliases", () => {
  it("maps every live Sendcloud UK carrier code to a checkout carrier or null", () => {
    const mapping = LIVE_SENDCLOUD_UK_CARRIER_CODES.map((raw) => ({
      raw,
      mapped: mapSendcloudCarrierToUk(raw),
    }));

    expect(mapping).toEqual([
      { raw: "dpd_gb", mapped: "DPD" },
      { raw: "fedex", mapped: "FedEx" },
      { raw: "hermes_c2c_gb", mapped: "Evri" },
      { raw: "inpost_gb", mapped: "InPost" },
      { raw: "royal_mailv2", mapped: "Royal Mail" },
      { raw: "sendcloud", mapped: null },
    ]);
  });

  it("maps additional documented UK aliases", () => {
    expect(mapSendcloudCarrierToUk("royal_mail")).toBe("Royal Mail");
    expect(mapSendcloudCarrierToUk("royal_mail_v2")).toBe("Royal Mail");
    expect(mapSendcloudCarrierToUk("dpd")).toBe("DPD");
    expect(mapSendcloudCarrierToUk("hermes")).toBe("Evri");
    expect(mapSendcloudCarrierToUk("hermes_c2c")).toBe("Evri");
    expect(mapSendcloudCarrierToUk("evri")).toBe("Evri");
    expect(mapSendcloudCarrierToUk("inpost")).toBe("InPost");
    expect(mapSendcloudCarrierToUk("parcelforce")).toBe("Parcelforce");
    expect(mapSendcloudCarrierToUk("ups")).toBe("UPS");
    expect(mapSendcloudCarrierToUk("dhl")).toBe("DHL");
    expect(mapSendcloudCarrierToUk("dhl_gb")).toBe("DHL");
  });

  it("normalizes carrier keys consistently", () => {
    expect(normalizeSendcloudCarrierKey("Royal-Mail v2")).toBe("royal_mail_v2");
    expect(normalizeSendcloudCarrierKey("DPD GB")).toBe("dpd_gb");
  });

  it("does not discard mappable UK carriers at quote mapping time", () => {
    const checkoutCarriers = allCarrierNames();

    for (const raw of LIVE_SENDCLOUD_UK_CARRIER_CODES) {
      if (raw === "sendcloud") continue;

      const mapped = mapSendcloudMethodCarrier(raw);
      expect(mapped).not.toBeNull();
      expect(checkoutCarriers).toContain(mapped);
    }
  });

  it("skips non-carrier Sendcloud placeholder methods", () => {
    const quote = mapSendcloudMethodToQuote({
      id: 8,
      name: "Unstamped letter",
      carrier: "sendcloud",
      min_weight: "0.001",
      max_weight: "1.000",
      service_point_input: "none",
      countries: [
        {
          id: 9,
          name: "United Kingdom",
          price: 0,
          iso_2: "GB",
          iso_3: "GBR",
          lead_time_hours: 48,
        },
      ],
    });

    expect(quote).toBeNull();
  });
});
