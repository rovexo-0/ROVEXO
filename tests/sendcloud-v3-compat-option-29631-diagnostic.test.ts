/**
 * Focused tests: Super Admin V3 shipping-options forensic for RVXC75CA5BB / 29631.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";

const requireApiSuperAdmin = vi.fn();
const discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic = vi.fn();
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
  discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic: (...args: unknown[]) =>
    discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/diagnostic-v3-option-29631/route";
import {
  buildV3Option29631ForensicReport,
  isExactRoyalMailTracked48LargeLetter,
  matchRoyalMailTracked48LargeLetter,
} from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";

const exactOption = {
  code: "royal_mail:tracked_48:large_letter",
  name: "Royal Mail Tracked 48 - Large Letter",
  carrier: { code: "royal_mail", name: "Royal Mail" },
  product: { code: "tracked_48", name: "Royal Mail Tracked 48 - Large Letter" },
  contract: { id: "42", name: "RM contract" },
  quotes: [{ price: { value: "2.38", currency: "GBP" } }],
  requirements: { direct_contract_only: false },
};

const tracked24 = {
  code: "royal_mail:tracked_24:large_letter",
  name: "Royal Mail Tracked 24 - Large Letter",
  carrier: { code: "royal_mail", name: "Royal Mail" },
  product: { name: "Royal Mail Tracked 24 - Large Letter" },
};

const tracked48Parcel = {
  code: "royal_mail:tracked_48:parcel",
  name: "Royal Mail Tracked 48",
  carrier: { code: "royal_mail", name: "Royal Mail" },
  product: { name: "Royal Mail Tracked 48" },
};

function mockDiscoverFromBody(data: unknown[]) {
  const forensic = buildV3Option29631ForensicReport({ data });
  return {
    forensic,
    match: matchRoyalMailTracked48LargeLetter({ data }),
    requestUrlPath: "/shipping-options",
    requestBody: {
      from_country_code: "GB",
      to_country_code: "GB",
      carrier_code: "royal_mail",
    },
    orderId: "50a8b313-1fd3-4104-8af5-725a84a3350e",
    orderNumber: "RVXC75CA5BB",
    methodId: 29631,
    selectedQuoteId: "sendcloud:29631",
    selectedServiceName: "Royal Mail Tracked 48 - Large Letter",
  };
}

describe("POST /api/super-admin/shipping/diagnostic-v3-option-29631", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSendcloudConfigured.mockReturnValue(true);
    discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic.mockResolvedValue(
      mockDiscoverFromBody([exactOption]),
    );
  });

  it("rejects unauthenticated requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-29631", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic).not.toHaveBeenCalled();
  });

  it("rejects non-super-admin requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-29631", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic).not.toHaveBeenCalled();
  });

  it("rejects wrong or extra body fields", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const wrong = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-29631", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: "00000000-0000-0000-0000-000000000000" }),
      }),
    );
    expect(wrong.status).toBe(400);
    expect(discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic).not.toHaveBeenCalled();
  });

  it("returns safe forensic mapping fields without secrets for Super Admin", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-29631", {
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
    expect(json.methodId).toBe(29631);
    expect(json.mappingConfirmed).toBe(true);
    expect(json.MAPPING_CONFIRMED).toBe(true);
    expect(json.result).toBe("MAPPING_CONFIRMED");
    expect(json.exactMatchCount).toBe(1);
    expect(json.exactMatchReason).toBe("EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER");
    expect(json.shippingOptionCode).toBe("royal_mail:tracked_48:large_letter");
    expect(json.candidateCount).toBe(1);
    expect(json.candidates[0].shipping_option_code).toBe("royal_mail:tracked_48:large_letter");
    expect(json.candidates[0].carrier).toBe("Royal Mail");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("authorization");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("secret");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("basic ");
    expect(json).not.toHaveProperty("raw");
  });

  it("returns NO_V3_COUNTERPART with safe Royal Mail candidates when no exact match", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });
    discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic.mockResolvedValue(
      mockDiscoverFromBody([tracked24, tracked48Parcel]),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-29631", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.methodId).toBe(29631);
    expect(json.result).toBe("NO_V3_COUNTERPART");
    expect(json.RESULT).toBe("NO_V3_COUNTERPART");
    expect(json.mappingConfirmed).toBe(false);
    expect(json.shippingOptionCode).toBeNull();
    expect(json.exactMatchCount).toBe(0);
    expect(json.exactMatchReason).toBe("NO_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER");
    expect(json.candidateCount).toBe(2);
    expect(json.candidates).toHaveLength(2);
    expect(json.candidates.map((c: { forensic_class: string }) => c.forensic_class).sort()).toEqual(
      ["tracked_24", "tracked_48_without_large_letter"].sort(),
    );
    expect(String(json.error)).toContain("NO_V3_COUNTERPART");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("authorization");
  });

  it("source: V3 shipping-options path + locked order; no shipment/parcel/label/DB mutate", () => {
    const route = readFileSync(
      "app/api/super-admin/shipping/diagnostic-v3-option-29631/route.ts",
      "utf8",
    );
    const client = readFileSync("lib/shipping/sendcloud/client.ts", "utf8");
    const lock = readFileSync(
      "lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1.ts",
      "utf8",
    );

    expect(route).toContain("requireApiSuperAdmin");
    expect(route).toContain("discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic");
    expect(route).toContain("NO_V3_COUNTERPART");
    expect(route).toContain("exactMatchCount");
    expect(route).toContain("exactMatchReason");
    expect(route).toContain("mappingConfirmed");
    expect(route).not.toContain("createSendcloudParcel");
    expect(route).not.toContain("generateShippingLabelForOrder");
    expect(route).not.toContain("createAdminClient");
    expect(route).not.toContain(".from(");
    expect(route).not.toContain("shipments/announce");
    expect(route).not.toContain("/shipments");
    expect(route).not.toContain("forensic.raw");
    expect(route).not.toContain("result.raw");

    const discoverStart = client.indexOf(
      "export async function discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic",
    );
    const discoverEnd = client.indexOf("async function sendcloudRequestOnce", discoverStart);
    const discoverFn = client.slice(discoverStart, discoverEnd);
    expect(discoverFn).toContain("sendcloudV3Request");
    expect(discoverFn).toContain("buildV3Option29631ForensicReport");
    expect(discoverFn).not.toContain("createSendcloudParcel");
    expect(discoverFn).not.toContain("/parcels");
    expect(discoverFn).not.toContain("/shipments");
    expect(discoverFn).not.toContain("raw,");

    expect(lock).toContain('path: "/shipping-options"');
    expect(lock).toContain("methodId: 29631");
    expect(lock).toContain("NO_V3_COUNTERPART");
    expect(lock).toContain("buildV3Option29631ForensicReport");
  });
});

describe("buildV3Option29631ForensicReport", () => {
  it("confirms exact Tracked 48 Large Letter mapping without inventing codes", () => {
    const report = buildV3Option29631ForensicReport({ data: [exactOption, tracked24] });
    expect(report.mappingConfirmed).toBe(true);
    expect(report.result).toBe("MAPPING_CONFIRMED");
    expect(report.shippingOptionCode).toBe("royal_mail:tracked_48:large_letter");
    expect(report.exactMatchCount).toBe(1);
    expect(report.candidateCount).toBe(2);
    expect(report.candidates.every((c) => c.carrier_code === "royal_mail")).toBe(true);
  });

  it("rejects Tracked 24 and Tracked 48 without Large Letter as exact", () => {
    expect(
      isExactRoyalMailTracked48LargeLetter({
        code: "royal_mail:tracked_24:large_letter",
        carrier_code: "royal_mail",
        carrier_name: "Royal Mail",
        product_code: null,
        product_name: "Royal Mail Tracked 24 - Large Letter",
        name: "Royal Mail Tracked 24 - Large Letter",
        contract_id: null,
        contract_name: null,
        quote_price: null,
        currency: null,
        requirements: null,
      }),
    ).toBe(false);

    const report = buildV3Option29631ForensicReport({ data: [tracked24, tracked48Parcel] });
    expect(report.result).toBe("NO_V3_COUNTERPART");
    expect(report.mappingConfirmed).toBe(false);
    expect(report.shippingOptionCode).toBeNull();
    expect(report.exactMatchCount).toBe(0);
    expect(report.candidateCount).toBe(2);
  });

  it("returns NO_V3_COUNTERPART when catalog empty", () => {
    const report = buildV3Option29631ForensicReport({ data: [] });
    expect(report.result).toBe("NO_V3_COUNTERPART");
    expect(report.exactMatchReason).toBe("NO_EXACT_ROYAL_MAIL_TRACKED_48_LARGE_LETTER");
    expect(report.candidateCount).toBe(0);
  });

  it("does not pick when multiple exact candidates exist", () => {
    const report = buildV3Option29631ForensicReport({
      data: [
        { ...exactOption, code: "royal_mail:tracked_48:large_letter:a" },
        { ...exactOption, code: "royal_mail:tracked_48:large_letter:b" },
      ],
    });
    expect(report.result).toBe("AMBIGUOUS_EXACT_MATCHES");
    expect(report.mappingConfirmed).toBe(false);
    expect(report.shippingOptionCode).toBeNull();
    expect(report.exactMatchCount).toBe(2);
  });
});
