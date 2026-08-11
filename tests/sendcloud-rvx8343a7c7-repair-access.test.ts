/**
 * Focused access tests for one-time RVX8343A7C7 Super Admin repair endpoint.
 * Mocks only — never executes production repair / Sendcloud / Stripe.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";

const requireApiSuperAdmin = vi.fn();
const repairPaidOrderShippingPersistence = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireApiSuperAdmin: (...args: unknown[]) => requireApiSuperAdmin(...args),
}));

vi.mock("@/lib/orders/repair-paid-order-shipping.server", () => ({
  repairPaidOrderShippingPersistence: (...args: unknown[]) =>
    repairPaidOrderShippingPersistence(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/repair-rvx8343a7c7/route";
import { RVX8343A7C7_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvx8343a7c7-orphan-shipping-repair-v1";

describe("POST /api/super-admin/shipping/repair-rvx8343a7c7", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repairPaidOrderShippingPersistence.mockResolvedValue({
      ok: true,
      orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
      orderNumber: RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber,
      shippingSetupStatus: "ready",
      shippingRecordId: "sr-8343",
      selectedQuoteId: RVX8343A7C7_ORPHAN_REPAIR_V1.expectedSelectedShippingQuoteId,
      idempotent: false,
      sendcloudCalled: false,
      parcelCreatedExternally: false,
      labelCreated: false,
    });
  });

  it("rejects unauthenticated requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvx8343a7c7", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(repairPaidOrderShippingPersistence).not.toHaveBeenCalled();
  });

  it("rejects non-super-admin requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvx8343a7c7", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(repairPaidOrderShippingPersistence).not.toHaveBeenCalled();
  });

  it("rejects wrong orderId with HTTP 400", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(repairPaidOrderShippingPersistence).not.toHaveBeenCalled();
  });

  it("rejects selectedShippingQuoteId override", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
          selectedShippingQuoteId: "sendcloud:27227",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(repairPaidOrderShippingPersistence).not.toHaveBeenCalled();
  });

  it("correct orderId invokes canonical repair with no quote override", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(repairPaidOrderShippingPersistence).toHaveBeenCalledTimes(1);
    expect(repairPaidOrderShippingPersistence).toHaveBeenCalledWith(
      "7554fb35-6261-4b4b-96a5-aef0273d9b5b",
    );
    // Exactly one argument — no options / no selectedShippingQuoteId.
    expect(repairPaidOrderShippingPersistence.mock.calls[0]).toHaveLength(1);

    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBe("repaired");
    expect(json.shippingRecordId).toBe("sr-8343");
    expect(json.selectedQuoteId).toBe("sendcloud:27227");
    expect(json.idempotent).toBe(false);
    expect(json.shippingSetupStatus).toBe("ready");
    expect(json.sendcloudCalled).toBe(false);
    expect(json.labelCreated).toBe(false);
    expect(json.parcelCreatedExternally).toBe(false);
    expect(JSON.stringify(json)).not.toMatch(/sk_live_|whsec_|service_role|Bearer /i);
  });

  it("empty body still hard-locks to RVX8343A7C7", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvx8343a7c7", {
        method: "POST",
      }),
    );

    expect(repairPaidOrderShippingPersistence).toHaveBeenCalledWith(
      RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
    );
  });

  it("does not call Sendcloud / Stripe / label from this repair endpoint", () => {
    const routeSource = readFileSync(
      "app/api/super-admin/shipping/repair-rvx8343a7c7/route.ts",
      "utf8",
    );
    const repairSource = readFileSync(
      "lib/orders/repair-paid-order-shipping.server.ts",
      "utf8",
    );
    const lockSource = readFileSync(
      "lib/orders/rvx8343a7c7-orphan-shipping-repair-v1.ts",
      "utf8",
    );

    expect(routeSource).toContain("requireApiSuperAdmin(request)");
    expect(routeSource).toContain("repairPaidOrderShippingPersistence");
    expect(routeSource).toContain("RVX8343A7C7_ORPHAN_REPAIR_V1.orderId");
    expect(routeSource).not.toContain("selectedShippingQuoteId:");
    expect(lockSource).toContain("7554fb35-6261-4b4b-96a5-aef0273d9b5b");
    expect(routeSource).not.toContain("SendcloudService");
    expect(routeSource).not.toContain("generateShippingLabelForOrder");
    expect(routeSource).not.toContain("sendcloudRequest");
    expect(routeSource).not.toMatch(/\bstripe\b/i);
    expect(routeSource).not.toContain("createRefund");
    expect(routeSource).not.toContain("refunds.create");
    expect(routeSource).toContain("no Sendcloud / label / refund");

    expect(repairSource).toContain("allowLiveQuoteEnrichment: false");
    expect(repairSource).toContain("sendcloudCalled: false");
    expect(repairSource).toContain("labelCreated: false");
    expect(repairSource).not.toContain("generateShippingLabelForOrder");
    expect(repairSource).not.toContain("createRefund");

    expect(lockSource).toContain("RVX8343A7C7");
    expect(lockSource).not.toContain("RVXC75CA5BB");

    // C75 route remains untouched and separate.
    const c75 = readFileSync(
      "app/api/super-admin/shipping/repair-rvxc75ca5bb/route.ts",
      "utf8",
    );
    expect(c75).toContain("RVXC75CA5BB_ORPHAN_REPAIR_V1");
    expect(c75).not.toContain("RVX8343A7C7");
  });

  it("preserves idempotent flag in response", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });
    repairPaidOrderShippingPersistence.mockResolvedValueOnce({
      ok: true,
      orderId: RVX8343A7C7_ORPHAN_REPAIR_V1.orderId,
      orderNumber: RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber,
      shippingSetupStatus: "ready",
      shippingRecordId: "sr-existing",
      selectedQuoteId: "sendcloud:27227",
      idempotent: true,
      sendcloudCalled: false,
      parcelCreatedExternally: false,
      labelCreated: false,
    });

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvx8343a7c7", {
        method: "POST",
      }),
    );
    const json = await response.json();
    expect(json.idempotent).toBe(true);
    expect(json.shippingRecordId).toBe("sr-existing");
  });
});
