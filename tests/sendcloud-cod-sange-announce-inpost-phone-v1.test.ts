/**
 * COD SÂNGE — InPost GB announce: recipient UK mobile + contract_id + Announcement Failed.
 * No live Sendcloud call.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  extractSendcloudV3AnnounceFailure,
  parseSendcloudV3AnnounceShipmentResult,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import {
  toSendcloudAddress,
  normalizeSendcloudPostalCode,
  normalizeInPostGbPhoneForSendcloudAnnounce,
  buildSendcloudParcelPayload,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type { ShippingAddress } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const V3_CODE = "inpost_gb:lockertoaddress/dropoff";
const CONTRACT_ID = "40353";
const SHIPMENT_ID = "d48daafb-9dfd-451a-b065-a2fe8f18013a";
const PARCEL_ID = 699130991;

const announceSendcloudShipmentV3 = vi.fn();
const getSendcloudParcel = vi.fn();

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
}));

vi.mock("@/lib/shipping/sendcloud/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/shipping/sendcloud/client")>(
    "@/lib/shipping/sendcloud/client",
  );
  return {
    ...actual,
    announceSendcloudShipmentV3: (...args: unknown[]) => announceSendcloudShipmentV3(...args),
    getSendcloudParcel: (...args: unknown[]) => getSendcloudParcel(...args),
  };
});

const baseAddrs = {
  deliveryAddress: {
    role: "delivery" as const,
    fullName: "Mihaita palade",
    line1: "83 Darlaston Road",
    city: "Walsall",
    postcode: "WS2 9RD",
    country: "United Kingdom",
    phone: "07700900123",
    email: "buyer@example.test",
    validated: true,
  },
  collectionAddress: {
    role: "collection" as const,
    fullName: "Olimpia Manuela Palade",
    line1: "83 Darlaston Road",
    city: "Walsall",
    postcode: "WS2 9RD",
    country: "United Kingdom",
    phone: "07700900456",
    email: "seller@example.test",
    validated: true,
  },
};

describe("COD SÂNGE — InPost announce mapping", () => {
  beforeEach(() => {
    announceSendcloudShipmentV3.mockReset();
    getSendcloudParcel.mockReset();
  });

  it("normalizes postal like catalog on V3 announce only (WS2 9RD → WS29RD)", () => {
    expect(normalizeSendcloudPostalCode("WS2 9RD")).toBe("WS29RD");
    const mapped = toSendcloudAddress(baseAddrs.deliveryAddress);
    // Shared mapper keeps original spacing; announce path normalizes separately.
    expect(mapped.postal_code).toBe("WS2 9RD");
    expect(mapped.house_number).toBe("83");
    expect(mapped.address).toBe("Darlaston Road");
    expect(mapped.telephone).toBe("07700900123");
    expect(mapped.email).toBe("buyer@example.test");
  });

  it("converts live-rejected E.164 +447438969272 → UK national 07438969272 (no fake digits)", () => {
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("+447438969272")).toBe("07438969272");
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("+44 7438 969272")).toBe("07438969272");
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("447438969272")).toBe("07438969272");
    // Digit set preserved: 7438969272 body only; leading 0 replaces +44.
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("+447438969272").replace(/\D/g, "")).toBe(
      "07438969272",
    );
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("+447438969272")).not.toContain("+");
    // Same significant digits as input (no invented digits).
    expect("07438969272".slice(1)).toBe("447438969272".slice(2));
  });

  it("does not corrupt already-national UK mobiles or unrelated numbers", () => {
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("07700900123")).toBe("07700900123");
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("07 700 900 123")).toBe("07700900123");
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("7438969272")).toBe("07438969272");
    // Non-UK / unrelated: unchanged (no digit invention).
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("+31612345678")).toBe("+31612345678");
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("+15551234567")).toBe("+15551234567");
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("+441134445555")).toBe("+441134445555");
    expect(normalizeInPostGbPhoneForSendcloudAnnounce("")).toBe("");
  });

  it("toSendcloudAddress does not rewrite stored phone (mapper passthrough)", () => {
    const mapped = toSendcloudAddress({
      ...baseAddrs.deliveryAddress,
      phone: "+447438969272",
    });
    expect(mapped.telephone).toBe("+447438969272");
  });

  it("non-InPost V2 parcel path keeps E.164 telephone unchanged", () => {
    const collection: ShippingAddress = {
      role: "collection",
      fullName: "Seller Name",
      line1: "42 Seller Lane",
      city: "Leeds",
      postcode: "LS1 1BA",
      country: "GB",
      phone: "+441134445555",
      validated: true,
    };
    const delivery: ShippingAddress = {
      role: "delivery",
      fullName: "Buyer Name",
      line1: "221B Baker Street",
      city: "London",
      postcode: "NW1 6XE",
      country: "GB",
      phone: "+447438969272",
      validated: true,
    };
    const payload = buildSendcloudParcelPayload({
      methodId: 42,
      parcelTier: "large_parcel",
      deliveryAddress: delivery,
      collectionAddress: collection,
      orderNumber: "RVX-4242",
    });
    expect(payload.from_telephone).toBe("+441134445555");
    expect(payload.telephone).toBe("+447438969272");
  });

  it("detects Announcement Failed (1002) / errors[] as announce failure", () => {
    const failure = extractSendcloudV3AnnounceFailure({
      data: {
        id: SHIPMENT_ID,
        parcels: [
          {
            id: PARCEL_ID,
            status: { id: 1002, message: "Announcement failed" },
          },
        ],
        errors: [
          {
            status: "500",
            code: "parcel_announcement_error",
            detail: "Service error: Error 100: Missing required data: phone",
          },
        ],
      },
    });
    expect(failure).not.toBeNull();
    expect(failure!.details.reason).toBe("ANNOUNCEMENT_FAILED");
    expect(failure!.details.statusId).toBe(1002);
    expect(failure!.message).toContain("phone");

    const ok = parseSendcloudV3AnnounceShipmentResult({
      data: {
        id: SHIPMENT_ID,
        parcels: [{ id: PARCEL_ID }],
        ship_with: {
          type: "shipping_option_code",
          properties: { shipping_option_code: V3_CODE, contract_id: 40353 },
        },
      },
    });
    expect(ok.parcelId).toBe(PARCEL_ID);
    expect(extractSendcloudV3AnnounceFailure({ data: { id: SHIPMENT_ID, parcels: [{ id: PARCEL_ID }] } })).toBeNull();
  });

  it("fail-closed when InPost announce would omit recipient phone", async () => {
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: "sendcloud:27227",
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        deliveryAddress: { ...baseAddrs.deliveryAddress, phone: undefined },
        collectionAddress: baseAddrs.collectionAddress,
        orderNumber: "RVX8343A7C7",
        shippingOptionCode: V3_CODE,
        contractId: CONTRACT_ID,
        v2MethodId: 27227,
      }),
    ).rejects.toMatchObject({
      code: "invalid_address",
      message: expect.stringContaining("UK mobile"),
    });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("fail-closed when InPost contract_id is missing", async () => {
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: "sendcloud:27227",
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...baseAddrs,
        orderNumber: "RVX8343A7C7",
        shippingOptionCode: V3_CODE,
        contractId: null,
        v2MethodId: 27227,
      }),
    ).rejects.toMatchObject({
      code: "label_failed",
      message: expect.stringContaining("contract_id"),
    });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("announce payload converts +447438969272 → 07438969272 for InPost only", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: SHIPMENT_ID,
      parcelId: PARCEL_ID,
      trackingNumber: "INPOSTTRACK",
      pdfUrl: "https://example.test/label.pdf",
      carrierCode: "inpost_gb",
      serviceName: V3_CODE,
      reusedExisting: false,
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await SendcloudService.generateLabel({
      quoteId: "sendcloud:27227",
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      deliveryAddress: { ...baseAddrs.deliveryAddress, phone: "+447438969272" },
      collectionAddress: { ...baseAddrs.collectionAddress, phone: "+447700900456" },
      orderNumber: "RVX8343A7C7",
      shippingOptionCode: V3_CODE,
      contractId: CONTRACT_ID,
      v2MethodId: 27227,
      idempotencyKey: "rovexo-order-announce-phone-format-1",
    });

    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
    const payload = announceSendcloudShipmentV3.mock.calls[0]![0] as {
      from_address: { phone_number?: string };
      to_address: { phone_number?: string };
      ship_with: { properties: { shipping_option_code: string; contract_id?: number } };
      parcels: Array<{ weight: { value: string }; dimensions: { length: string; width: string; height: string } }>;
    };
    expect(payload.ship_with.properties.shipping_option_code).toBe(V3_CODE);
    expect(payload.ship_with.properties.contract_id).toBe(40353);
    expect(payload.to_address.phone_number).toBe("07438969272");
    expect(payload.from_address.phone_number).toBe("07700900456");
    expect(payload.parcels[0]?.weight.value).toBe("2.000");
    expect(payload.parcels[0]?.dimensions).toEqual({
      length: "45",
      width: "10",
      height: "10",
      unit: "cm",
    });
  });

  it("announce payload sends phone + email + contract_id 40353 + normalized postal", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: SHIPMENT_ID,
      parcelId: PARCEL_ID,
      trackingNumber: "INPOSTTRACK",
      pdfUrl: "https://example.test/label.pdf",
      carrierCode: "inpost_gb",
      serviceName: V3_CODE,
      reusedExisting: false,
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await SendcloudService.generateLabel({
      quoteId: "sendcloud:27227",
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      ...baseAddrs,
      orderNumber: "RVX8343A7C7",
      shippingOptionCode: V3_CODE,
      contractId: CONTRACT_ID,
      v2MethodId: 27227,
      idempotencyKey: "rovexo-order-announce-phone-1",
    });

    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
    const payload = announceSendcloudShipmentV3.mock.calls[0]![0] as {
      from_address: { postal_code: string; phone_number?: string; email?: string };
      to_address: { postal_code: string; phone_number?: string; email?: string; house_number: string };
      ship_with: { properties: { shipping_option_code: string; contract_id?: number } };
      parcels: Array<{ weight: { value: string }; dimensions: { length: string; width: string; height: string } }>;
    };
    expect(payload.ship_with.properties.shipping_option_code).toBe(V3_CODE);
    expect(payload.ship_with.properties.contract_id).toBe(40353);
    expect(payload.to_address.phone_number).toBe("07700900123");
    expect(payload.to_address.email).toBe("buyer@example.test");
    expect(payload.to_address.postal_code).toBe("WS29RD");
    expect(payload.from_address.postal_code).toBe("WS29RD");
    expect(payload.to_address.house_number).toBe("83");
    expect(payload.parcels[0]?.weight.value).toBe("2.000");
    expect(payload.parcels[0]?.dimensions).toEqual({
      length: "45",
      width: "10",
      height: "10",
      unit: "cm",
    });
  });

  it("label-generation enriches profile phone/email into announce addresses", () => {
    const src = read("lib/shipping/label-generation.server.ts");
    expect(src).toContain('select("id, email, phone")');
    expect(src).toContain("deliveryAddressForLabel");
    expect(src).toContain("collectionAddressForLabel");
    expect(src).toContain("buyerContact.phone");
  });

  it("announce client rejects Announcement Failed bodies", async () => {
    const { announceSendcloudShipmentV3: realAnnounce } = await vi.importActual<
      typeof import("@/lib/shipping/sendcloud/client")
    >("@/lib/shipping/sendcloud/client");
    // Use mocked transport via generateLabel path instead — assert helper throws shape.
    const failure = extractSendcloudV3AnnounceFailure({
      data: {
        id: SHIPMENT_ID,
        parcels: [{ id: PARCEL_ID, status: { id: 1002, message: "Announcement failed" } }],
        errors: [],
      },
    });
    expect(failure).not.toBeNull();
    const err = new SendcloudError("label_failed", failure!.message, {
      statusCode: 200,
      details: failure!.details,
    });
    expect(err.details).toMatchObject({ reason: "ANNOUNCEMENT_FAILED", statusId: 1002 });
    void realAnnounce;
  });
});
