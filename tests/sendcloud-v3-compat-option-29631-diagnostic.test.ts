/**
 * Focused tests: Super Admin V3 compat diagnostic for locked method 29631.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";

const requireApiSuperAdmin = vi.fn();
const lookupSendcloudV3CompatShippingOption29631 = vi.fn();
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
  lookupSendcloudV3CompatShippingOption29631: (...args: unknown[]) =>
    lookupSendcloudV3CompatShippingOption29631(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/diagnostic-v3-option-29631/route";
import { extractV3CompatMappingFor29631 } from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";

describe("POST /api/super-admin/shipping/diagnostic-v3-option-29631", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSendcloudConfigured.mockReturnValue(true);
    lookupSendcloudV3CompatShippingOption29631.mockResolvedValue({
      raw: {
        data: [
          {
            shipping_method_id: 29631,
            shipping_option_code: "royal_mail:tracked_48:large_letter",
            contract_id: 42,
          },
        ],
      },
      mapping: {
        shippingOptionCode: "royal_mail:tracked_48:large_letter",
        contractId: "42",
        rawMappingConfirmed: true,
      },
      requestUrlPath: "/compat/shipping-options",
      requestBody: { shipping_method_ids: [29631] },
    });
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
    expect(lookupSendcloudV3CompatShippingOption29631).not.toHaveBeenCalled();
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
    expect(lookupSendcloudV3CompatShippingOption29631).not.toHaveBeenCalled();
  });

  it("rejects wrong or extra method IDs in the body", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const wrong = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-29631", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shipping_method_ids: [99999] }),
      }),
    );
    expect(wrong.status).toBe(400);
    expect(lookupSendcloudV3CompatShippingOption29631).not.toHaveBeenCalled();

    const extra = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/diagnostic-v3-option-29631", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ methodId: 29631, extra: true }),
      }),
    );
    expect(extra.status).toBe(400);
    expect(lookupSendcloudV3CompatShippingOption29631).not.toHaveBeenCalled();
  });

  it("returns safe mapping fields without secrets for Super Admin", async () => {
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
    expect(json).toEqual({
      ok: true,
      methodId: 29631,
      shippingOptionCode: "royal_mail:tracked_48:large_letter",
      contractId: "42",
      rawMappingConfirmed: true,
    });
    expect(JSON.stringify(json).toLowerCase()).not.toContain("authorization");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("secret");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("basic ");
  });

  it("source: V3 compat path + locked payload; no shipment/parcel/label/DB", () => {
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
    expect(route).toContain("lookupSendcloudV3CompatShippingOption29631");
    expect(route).not.toContain("createSendcloudParcel");
    expect(route).not.toContain("generateShippingLabelForOrder");
    expect(route).not.toContain("createAdminClient");
    expect(route).not.toContain(".from(");
    expect(route).not.toContain("shipments/announce");

    expect(client).toContain("sendcloudV3Request");
    expect(client).toContain("lookupSendcloudV3CompatShippingOption29631");
    expect(client).toContain("shipping_method_ids");
    expect(client).toContain("getSendcloudV3BaseUrl");
    expect(client).not.toContain("createShipment");
    expect(lock).toContain('path: "/compat/shipping-options"');
    expect(lock).toContain("methodId: 29631");
    expect(lock).toContain("/api/v3/compat/shipping-options");
  });
});

describe("extractV3CompatMappingFor29631", () => {
  it("maps shipping_option_code for method 29631 without inventing contract_id", () => {
    const mapped = extractV3CompatMappingFor29631({
      results: [
        {
          shipping_method_id: 29631,
          shipping_option_code: "postnl:standard",
        },
      ],
    });
    expect(mapped.shippingOptionCode).toBe("postnl:standard");
    expect(mapped.contractId).toBeNull();
    expect(mapped.rawMappingConfirmed).toBe(true);
  });

  it("returns unconfirmed when mapping missing", () => {
    const mapped = extractV3CompatMappingFor29631({ data: [] });
    expect(mapped.shippingOptionCode).toBeNull();
    expect(mapped.rawMappingConfirmed).toBe(false);
  });
});
