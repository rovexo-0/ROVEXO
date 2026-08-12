/**
 * Focused tests: Super Admin V3 shipping-options forensic for RVX8343A7C7.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";

const requireApiSuperAdmin = vi.fn();
const discoverSendcloudV3OptionForRvx8343a7c7Diagnostic = vi.fn();
const isSendcloudConfigured = vi.fn(() => true);

vi.mock("@/lib/auth/session", () => ({
  requireApiSuperAdmin: (...args: unknown[]) => requireApiSuperAdmin(...args),
}));

vi.mock("@/lib/shipping/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/shipping/env")>("@/lib/shipping/env");
  return {
    ...actual,
    isSendcloudConfigured: (...args: unknown[]) => isSendcloudConfigured(...args),
  };
});

vi.mock("@/lib/shipping/sendcloud/client", () => ({
  discoverSendcloudV3OptionForRvx8343a7c7Diagnostic: (...args: unknown[]) =>
    discoverSendcloudV3OptionForRvx8343a7c7Diagnostic(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/diagnostic-v3-option-8343a7c7/route";
import {
  buildV3Option8343a7c7ForensicReport,
  isExactLocked8343ShippingOption,
  SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1,
} from "@/lib/shipping/sendcloud/v3-option-8343a7c7-diagnostic-v1";

const lockedOption = {
  code: "inpost_gb:lockertoaddress/dropoff",
  name: "InPost Locker to Address Dropoff",
  carrier: { code: "inpost_gb", name: "InPost" },
  product: { code: "lockertoaddress", name: "Locker to Address" },
  contract: { id: "77", name: "InPost contract" },
  quotes: [{ price: { value: "3.49", currency: "GBP" } }],
  requirements: { direct_contract_only: false },
};

const otherInpost = {
  code: "inpost_gb:lockertolocker/dropoff",
  name: "InPost Locker to Locker",
  carrier: { code: "inpost_gb", name: "InPost" },
  product: { name: "Locker to Locker" },
};

function mockDiscoverFromBody(data: unknown[]) {
  const forensic = buildV3Option8343a7c7ForensicReport({ data });
  return {
    forensic,
    requestUrlPath: "/shipping-options",
    requestBody: {
      from_country_code: "GB",
      to_country_code: "GB",
      from_postal_code: "SW1A1AA",
      to_postal_code: "M11AE",
      calculate_quotes: true,
      parcels: [
        {
          weight: { value: "1", unit: "kg" },
          dimensions: { length: "30", width: "20", height: "10", unit: "cm" },
        },
      ],
    },
    orderId: SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1.orderId,
    orderNumber: "RVX8343A7C7",
    methodId: 27227,
    lockedShippingOptionCode: SENDCLOUD_V3_OPTION_DIAGNOSTIC_8343A7C7_V1.lockedShippingOptionCode,
    selectedQuoteId: "sendcloud:27227",
    selectedServiceName: "InPost",
    routeContext: {
      from_country_code: "GB",
      to_country_code: "GB",
      from_postal_code: "SW1A1AA",
      to_postal_code: "M11AE",
      parcel_weight: "1",
      parcel_weight_unit: "kg" as const,
      parcel_length: "30",
      parcel_width: "20",
      parcel_height: "10",
      parcel_dimension_unit: "cm" as const,
    },
  };
}

describe("POST /api/super-admin/shipping/diagnostic-v3-option-8343a7c7", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSendcloudConfigured.mockReturnValue(true);
    discoverSendcloudV3OptionForRvx8343a7c7Diagnostic.mockResolvedValue(
      mockDiscoverFromBody([lockedOption]),
    );
  });

  it("rejects unauthenticated requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-8343a7c7", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(discoverSendcloudV3OptionForRvx8343a7c7Diagnostic).not.toHaveBeenCalled();
  });

  it("rejects non-super-admin requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-8343a7c7", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(discoverSendcloudV3OptionForRvx8343a7c7Diagnostic).not.toHaveBeenCalled();
  });

  it("rejects wrong or extra body fields", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const wrong = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: "00000000-0000-0000-0000-000000000000" }),
      }),
    );
    expect(wrong.status).toBe(400);
    expect(discoverSendcloudV3OptionForRvx8343a7c7Diagnostic).not.toHaveBeenCalled();
  });

  it("returns safe forensic fields for Super Admin when locked option available", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-8343a7c7", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.orderId).toBe("7554fb35-6261-4b4b-96a5-aef0273d9b5b");
    expect(json.orderNumber).toBe("RVX8343A7C7");
    expect(json.LOCKED_OPTION).toBe("inpost_gb:lockertoaddress/dropoff");
    expect(json.MATCHING_OPTION_FOUND).toBe("YES");
    expect(json.V3_OPTION_AVAILABLE_FOR_THIS_ROUTE).toBe("YES");
    expect(json.EXACT_FAILURE_CLASS).toBe("A");
    expect(json.DIAGNOSTIC_REQUEST_EXECUTED).toBe("YES");
    expect(json.READ_ONLY).toBe("YES");
    expect(json.PERSIST_PERFORMED).toBe("NO");
    expect(json.ANNOUNCE_CALLED).toBe("NO");
    expect(json.LABEL_CREATED).toBe("NO");
    expect(json.ORDER_MUTATED).toBe("NO");
    expect(json.PAYMENT_MUTATED).toBe("NO");
    expect(json.CONTRACT_ID_IF_RETURNED).toBe("77");
    expect(json.FROM_COUNTRY_CODE).toBe("GB");
    expect(json.PARCEL_WEIGHT_UNIT).toBe("kg");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("authorization");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("secret");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("basic ");
    expect(json).not.toHaveProperty("raw");
  });

  it("returns class B when locked option absent from catalog", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });
    discoverSendcloudV3OptionForRvx8343a7c7Diagnostic.mockResolvedValue(
      mockDiscoverFromBody([otherInpost]),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.MATCHING_OPTION_FOUND).toBe("NO");
    expect(json.V3_OPTION_AVAILABLE_FOR_THIS_ROUTE).toBe("NO");
    expect(json.EXACT_FAILURE_CLASS).toBe("B");
    expect(json.AVAILABLE_OPTIONS).toHaveLength(1);
    expect(json.AVAILABLE_OPTIONS[0].shipping_option_code).toBe(
      "inpost_gb:lockertolocker/dropoff",
    );
    expect(json.shippingOptionCode).toBeNull();
  });

  it("source: V3 shipping-options path + locked order; no shipment/parcel/label/DB mutate", () => {
    const route = readFileSync(
      "app/api/super-admin/shipping/diagnostic-v3-option-8343a7c7/route.ts",
      "utf8",
    );
    const client = readFileSync("lib/shipping/sendcloud/client.ts", "utf8");
    const lock = readFileSync(
      "lib/shipping/sendcloud/v3-option-8343a7c7-diagnostic-v1.ts",
      "utf8",
    );

    expect(route).toContain("requireApiSuperAdmin");
    expect(route).toContain("discoverSendcloudV3OptionForRvx8343a7c7Diagnostic");
    expect(route).toContain("RVX8343A7C7");
    expect(lock).toContain("RVX8343A7C7_ORPHAN_REPAIR_V1");
    expect(lock).toContain("lockedShippingOptionCode: \"inpost_gb:lockertoaddress/dropoff\"");
    const orphan = readFileSync("lib/orders/rvx8343a7c7-orphan-shipping-repair-v1.ts", "utf8");
    expect(orphan).toContain("7554fb35-6261-4b4b-96a5-aef0273d9b5b");
    expect(route).not.toContain("createSendcloudParcel");
    expect(route).not.toContain("generateShippingLabelForOrder");
    expect(route).not.toContain("createAdminClient");
    expect(route).not.toContain(".from(");
    expect(route).not.toContain("shipments/announce");
    expect(route).not.toContain("/shipments");
    expect(route).not.toContain("diagnostic-v3-option-29631");

    const discoverStart = client.indexOf(
      "export async function discoverSendcloudV3OptionForRvx8343a7c7Diagnostic",
    );
    const discoverEnd = client.indexOf("async function sendcloudRequestOnce", discoverStart);
    const discoverFn = client.slice(discoverStart, discoverEnd);
    expect(discoverFn).toContain("fetchSendcloudV3ShippingOptionsCatalog");
    expect(discoverFn).toContain("buildV3Option8343a7c7ForensicReport");
    expect(discoverFn).not.toContain("createSendcloudParcel");
    expect(discoverFn).not.toContain("/parcels");
    expect(discoverFn).not.toContain("/shipments");
    expect(discoverFn).not.toContain("announceSendcloudShipmentV3");
    expect(discoverFn).not.toContain("carrierCode:");

    expect(lock).toContain('path: "/shipping-options"');
    expect(lock).toContain("methodId: 27227");
    expect(lock).toContain("inpost_gb:lockertoaddress/dropoff");
    expect(lock).toContain("buildV3Option8343a7c7ForensicReport");
  });
});

describe("buildV3Option8343a7c7ForensicReport", () => {
  it("confirms exact locked code without inventing substitutes", () => {
    const report = buildV3Option8343a7c7ForensicReport({ data: [lockedOption, otherInpost] });
    expect(report.matchingOptionFound).toBe(true);
    expect(report.result).toBe("LOCKED_OPTION_AVAILABLE");
    expect(report.failureClass).toBe("A");
    expect(report.shippingOptionCode).toBe("inpost_gb:lockertoaddress/dropoff");
    expect(report.contractId).toBe("77");
    expect(report.candidateCount).toBe(2);
  });

  it("does not match by name when code differs", () => {
    expect(
      isExactLocked8343ShippingOption({
        code: "inpost_gb:something_else",
        carrier_code: "inpost_gb",
        carrier_name: "InPost",
        product_code: null,
        product_name: "Locker to Address Dropoff",
        name: "inpost_gb:lockertoaddress/dropoff",
        contract_id: null,
        contract_name: null,
        quote_price: null,
        currency: null,
        requirements: null,
      }),
    ).toBe(false);

    const report = buildV3Option8343a7c7ForensicReport({ data: [otherInpost] });
    expect(report.result).toBe("LOCKED_OPTION_UNAVAILABLE_FOR_ROUTE_PARCEL");
    expect(report.failureClass).toBe("B");
    expect(report.shippingOptionCode).toBeNull();
  });

  it("classifies D when direct_contract_only and contract_id missing", () => {
    const report = buildV3Option8343a7c7ForensicReport({
      data: [
        {
          ...lockedOption,
          contract: null,
          requirements: { direct_contract_only: true },
        },
      ],
    });
    expect(report.result).toBe("CONTRACT_ID_REQUIRED_AND_MISSING");
    expect(report.failureClass).toBe("D");
    expect(report.matchingOptionFound).toBe(true);
    expect(report.v3OptionAvailableForThisRoute).toBe("UNKNOWN");
  });

  it("returns class B when catalog empty", () => {
    const report = buildV3Option8343a7c7ForensicReport({ data: [] });
    expect(report.failureClass).toBe("B");
    expect(report.v3OptionAvailableForThisRoute).toBe("NO");
    expect(report.candidateCount).toBe(0);
  });
});
