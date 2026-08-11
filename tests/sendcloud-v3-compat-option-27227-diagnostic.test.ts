/**
 * Focused tests: Super Admin V3 compat forensic for RVX8343A7C7 / method 27227.
 * Mocks only — never calls live Sendcloud / DB / label / payment.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";

const requireApiSuperAdmin = vi.fn();
const fetchSendcloudV3CompatMappingsForMethodIds = vi.fn();
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

vi.mock("@/lib/shipping/sendcloud/v3-catalog-v1", () => ({
  fetchSendcloudV3CompatMappingsForMethodIds: (...args: unknown[]) =>
    fetchSendcloudV3CompatMappingsForMethodIds(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/diagnostic-v3-compat-27227/route";
import {
  SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1,
  classifySendcloudV3Compat27227Codes,
  classifySendcloudV3Compat27227Mapping,
} from "@/lib/shipping/sendcloud/v3-compat-option-27227-diagnostic-v1";

const METHOD_ID = SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.methodId;
const VALID_V3 = "inpost_gb:locker:standard";

function mappingMap(code: string | null) {
  return new Map([
    [
      METHOD_ID,
      {
        v2MethodId: METHOD_ID,
        shippingOptionCode: code,
        contractId: null as string | null,
        result: (code ? "MAPPING_CONFIRMED" : "NO_V3_COUNTERPART") as
          | "MAPPING_CONFIRMED"
          | "NO_V3_COUNTERPART",
      },
    ],
  ]);
}

describe("POST /api/super-admin/shipping/diagnostic-v3-compat-27227", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSendcloudConfigured.mockReturnValue(true);
    fetchSendcloudV3CompatMappingsForMethodIds.mockResolvedValue(mappingMap(VALID_V3));
  });

  it("rejects unauthenticated requests with 401", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-compat-27227", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(fetchSendcloudV3CompatMappingsForMethodIds).not.toHaveBeenCalled();
  });

  it("rejects non-super-admin requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-compat-27227", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchSendcloudV3CompatMappingsForMethodIds).not.toHaveBeenCalled();
  });

  it("passes only method 27227 to the canonical compatibility function", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-compat-27227", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({}),
      }),
    );

    expect(fetchSendcloudV3CompatMappingsForMethodIds).toHaveBeenCalledTimes(1);
    expect(fetchSendcloudV3CompatMappingsForMethodIds).toHaveBeenCalledWith([27227]);
  });

  it("returns V3_EXACT_COUNTERPART_FOUND for a valid V3 code", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-compat-27227", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({
          orderId: SENDCLOUD_V3_COMPAT_OPTION_DIAGNOSTIC_27227_V1.orderId,
          methodId: 27227,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.v2MethodId).toBe(27227);
    expect(json.legacyQuoteId).toBe("sendcloud:27227");
    expect(json.compatHttpStatus).toBe(200);
    expect(json.classification).toBe("V3_EXACT_COUNTERPART_FOUND");
    expect(json.confirmedShippingOptionCode).toBe(VALID_V3);
    expect(json.mapping).toEqual({
      v2MethodId: 27227,
      shippingOptionCode: VALID_V3,
      result: "MAPPING_CONFIRMED",
    });
    expect(JSON.stringify(json).toLowerCase()).not.toContain("authorization");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("secret");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("basic ");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("service_role");
    expect(json).not.toHaveProperty("raw");
    expect(json).not.toHaveProperty("headers");
  });

  it("returns V3_NO_COUNTERPART when mapping is null", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });
    fetchSendcloudV3CompatMappingsForMethodIds.mockResolvedValue(mappingMap(null));

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-compat-27227", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.classification).toBe("V3_NO_COUNTERPART");
    expect(json.confirmedShippingOptionCode).toBeNull();
    expect(json.mapping.shippingOptionCode).toBeNull();
    expect(json.mapping.result).toBe("NO_V3_COUNTERPART");
  });

  it("returns DIAGNOSTIC_BLOCKED when Sendcloud is not configured", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });
    isSendcloudConfigured.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-compat-27227", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.classification).toBe("DIAGNOSTIC_BLOCKED");
    expect(json.confirmedShippingOptionCode).toBeNull();
    expect(fetchSendcloudV3CompatMappingsForMethodIds).not.toHaveBeenCalled();
  });

  it("rejects wrong order/method body fields", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-compat-27227", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ methodId: 29631 }),
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchSendcloudV3CompatMappingsForMethodIds).not.toHaveBeenCalled();
  });

  it("source: compat path only; no shipment/parcel/label/order/payment mutate; no secrets", () => {
    const route = readFileSync(
      "app/api/super-admin/shipping/diagnostic-v3-compat-27227/route.ts",
      "utf8",
    );
    const lock = readFileSync(
      "lib/shipping/sendcloud/v3-compat-option-27227-diagnostic-v1.ts",
      "utf8",
    );

    expect(route).toContain("requireApiSuperAdmin");
    expect(route).toContain("fetchSendcloudV3CompatMappingsForMethodIds");
    expect(route).toContain("[METHOD_ID]");
    expect(route).toContain("V3_EXACT_COUNTERPART_FOUND");
    expect(route).toContain("V3_NO_COUNTERPART");
    expect(route).toContain("V3_AMBIGUOUS");
    expect(route).toContain("buildSendcloudV3Compat27227BlockedReport");
    expect(route).not.toContain("createSendcloudParcel");
    expect(route).not.toContain("generateShippingLabelForOrder");
    expect(route).not.toContain("announceSendcloudShipmentV3");
    expect(route).not.toContain("createAdminClient");
    expect(route).not.toContain("repairPaidOrderShippingPersistence");
    expect(route).not.toContain("/parcels");
    expect(route).not.toContain("/shipments");
    expect(route).not.toContain("shipments/announce");
    expect(route).not.toContain(".from(");
    expect(route).not.toContain("process.env");
    expect(route).not.toContain("SERVICE_ROLE");

    expect(lock).toContain('path: "/compat/shipping-options"');
    expect(lock).toContain("methodId: 27227");
    expect(lock).toContain('legacyQuoteId: "sendcloud:27227"');
    expect(lock).toContain("V3_AMBIGUOUS");
    expect(lock).toContain("DIAGNOSTIC_BLOCKED");
    expect(lock).toContain("V3_NO_COUNTERPART");
    expect(lock).not.toContain("createSendcloudParcel");
    expect(lock).not.toContain("/shipments/announce");
  });
});

describe("classifySendcloudV3Compat27227*", () => {
  it("maps confirmed mapping to V3_EXACT_COUNTERPART_FOUND", () => {
    const report = classifySendcloudV3Compat27227Mapping({
      v2MethodId: 27227,
      shippingOptionCode: VALID_V3,
      contractId: null,
      result: "MAPPING_CONFIRMED",
    });
    expect(report.classification).toBe("V3_EXACT_COUNTERPART_FOUND");
    expect(report.confirmedShippingOptionCode).toBe(VALID_V3);
  });

  it("maps null mapping to V3_NO_COUNTERPART", () => {
    const report = classifySendcloudV3Compat27227Mapping({
      v2MethodId: 27227,
      shippingOptionCode: null,
      contractId: null,
      result: "NO_V3_COUNTERPART",
    });
    expect(report.classification).toBe("V3_NO_COUNTERPART");
    expect(report.confirmedShippingOptionCode).toBeNull();
  });

  it("rejects numeric and sendcloud:N identities as V3 codes", () => {
    expect(classifySendcloudV3Compat27227Codes(["27227"]).classification).toBe(
      "V3_NO_COUNTERPART",
    );
    expect(classifySendcloudV3Compat27227Codes(["sendcloud:27227"]).classification).toBe(
      "V3_NO_COUNTERPART",
    );
  });

  it("returns V3_AMBIGUOUS for multiple distinct confirmed codes", () => {
    const report = classifySendcloudV3Compat27227Codes([
      "inpost_gb:locker:a",
      "inpost_gb:locker:b",
    ]);
    expect(report.classification).toBe("V3_AMBIGUOUS");
    expect(report.confirmedShippingOptionCode).toBeNull();
    expect(report.mapping.result).toBe("AMBIGUOUS");
    expect(report.mapping.shippingOptionCode).toBeNull();
  });
});
