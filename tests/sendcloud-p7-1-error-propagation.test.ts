/**
 * P7.1 — Error propagation for controlled label path.
 * No live Sendcloud · no production endpoint · no order/payment mutation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import {
  classifySendcloudErrorKind,
  providerFailureFromUnknownError,
  sanitizeProviderFailureMessage,
  shippingLabelProviderFailure,
} from "@/lib/shipping/pricing/label-provider-failure-v1";
import { resolveControlledLabelHttpStatus } from "@/app/api/super-admin/shipping/generate-label-rvx8343a7c7/route";
import type { ControlledLabelRvx8343a7c7Result } from "@/lib/shipping/generate-label-rvx8343a7c7.server";
import { RVX8343A7C7_CONTROLLED_LABEL_V1 } from "@/lib/orders/rvx8343a7c7-controlled-label-v1";

const generateLabel = vi.fn();
const requireApiSuperAdmin = vi.fn();
const generateControlledLabelForRvx8343a7c7 = vi.fn();

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
  getSendcloudPublicKey: () => "pub",
  getSendcloudSecretKey: () => "sec",
  getSendcloudBaseUrl: () => "https://panel.sendcloud.sc/api/v2",
}));

vi.mock("@/lib/full-demo/security", () => ({
  mustUseDemoShipping: () => false,
  mustUseDemoShippingForActors: () => false,
}));

vi.mock("@/lib/shipping/sendcloud/service", () => ({
  SendcloudService: {
    generateLabel: (...args: unknown[]) => generateLabel(...args),
    getQuotes: vi.fn(),
    checkHealth: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  requireApiSuperAdmin: (...args: unknown[]) => requireApiSuperAdmin(...args),
}));

vi.mock("@/lib/shipping/generate-label-rvx8343a7c7.server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/shipping/generate-label-rvx8343a7c7.server")>();
  return {
    ...actual,
    generateControlledLabelForRvx8343a7c7: (...args: unknown[]) =>
      generateControlledLabelForRvx8343a7c7(...args),
  };
});

import { POST } from "@/app/api/super-admin/shipping/generate-label-rvx8343a7c7/route";

const LOCK = RVX8343A7C7_CONTROLLED_LABEL_V1;

function baseResult(
  overrides: Partial<ControlledLabelRvx8343a7c7Result>,
): ControlledLabelRvx8343a7c7Result {
  return {
    ok: false,
    status: "label_failed",
    orderId: LOCK.orderId,
    orderNumber: LOCK.orderNumber,
    shippingSetupStatus: "ready",
    shippingOptionCode: LOCK.confirmedShippingOptionCode,
    shippingRecordId: LOCK.expectedShippingRecordId,
    shippingQuoteRowId: LOCK.expectedShippingQuoteRowId,
    sendcloudCalled: false,
    sendcloudHttpStatus: null,
    failureKind: "rovexo_validation",
    providerDetails: null,
    shipmentCreated: false,
    parcelCreatedExternally: false,
    labelCreated: false,
    shipmentId: null,
    parcelId: null,
    labelId: null,
    trackingNumber: null,
    idempotent: false,
    duplicateShipmentPrevented: false,
    orderAmountMutated: false,
    paymentMutated: false,
    otherOrdersMutated: false,
    ...overrides,
  };
}

describe("P7.1 error propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateLabel.mockReset();
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "sa-1" },
      role: "super_admin",
    });
  });

  it("A: SendcloudError with statusCode preserves statusCode", async () => {
    generateLabel.mockRejectedValue(
      new SendcloudError("api_error", "Sendcloud rejected shipment", { statusCode: 422 }),
    );
    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    const result = await adapter.createLabel({
      quoteId: "sendcloud:27227",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      parcelTier: "small_parcel",
      weightKg: 1.2,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Road",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        validated: true,
      },
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "2 Road",
        city: "Manchester",
        postcode: "M1 1AE",
        country: "GB",
        validated: true,
      },
      shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
    });

    expect(result.available).toBe(false);
    expect(result.providerFailure?.statusCode).toBe(422);
    expect(result.providerFailure?.kind).toBe("provider_http");
    expect(result.providerFailure?.providerRequestAttempted).toBe(true);
  });

  it("B: SendcloudError message reaches structured failure", async () => {
    const message = "Exact provider rejection message for forensics";
    generateLabel.mockRejectedValue(
      new SendcloudError("api_error", message, { statusCode: 400 }),
    );
    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const result = await new SendcloudAdapter().createLabel({
      quoteId: "sendcloud:27227",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      parcelTier: "small_parcel",
      weightKg: 1.2,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Road",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        validated: true,
      },
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "2 Road",
        city: "Manchester",
        postcode: "M1 1AE",
        country: "GB",
        validated: true,
      },
    });
    expect(result.providerFailure?.message).toBe(message);
  });

  it("C: transport failure with no HTTP status does NOT become HTTP 422", () => {
    const result = baseResult({
      sendcloudCalled: true,
      sendcloudHttpStatus: null,
      failureKind: "provider_transport",
      error: "Sendcloud network error: fetch failed",
    });
    expect(resolveControlledLabelHttpStatus(result)).toBe(502);
    expect(resolveControlledLabelHttpStatus(result)).not.toBe(422);
  });

  it("D: sendcloudCalled is false when provider request was not attempted", async () => {
    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const result = await new SendcloudAdapter().createLabel({
      quoteId: "not-a-sendcloud-quote",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      parcelTier: "small_parcel",
      weightKg: 1.2,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Road",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        validated: true,
      },
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "2 Road",
        city: "Manchester",
        postcode: "M1 1AE",
        country: "GB",
        validated: true,
      },
    });
    expect(generateLabel).not.toHaveBeenCalled();
    expect(result.providerFailure?.providerRequestAttempted).toBe(false);
    expect(result.providerFailure?.kind).toBe("provider_validation");
  });

  it("E: sendcloudCalled/attempted true only when provider operation invoked", async () => {
    generateLabel.mockRejectedValue(
      new SendcloudError("network_error", "Sendcloud network error: reset"),
    );
    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const result = await new SendcloudAdapter().createLabel({
      quoteId: "sendcloud:27227",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      parcelTier: "small_parcel",
      weightKg: 1.2,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Road",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        validated: true,
      },
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "2 Road",
        city: "Manchester",
        postcode: "M1 1AE",
        country: "GB",
        validated: true,
      },
    });
    expect(generateLabel).toHaveBeenCalledTimes(1);
    expect(result.providerFailure?.providerRequestAttempted).toBe(true);
    expect(result.providerFailure?.kind).toBe("provider_transport");
    expect(result.providerFailure?.statusCode).toBeNull();
  });

  it("F: successful label flow remains unchanged (available + tracking)", async () => {
    generateLabel.mockResolvedValue({
      parcelId: 99,
      trackingNumber: "TRACK1",
      pdfUrl: "https://panel.sendcloud.sc/label/1.pdf",
      carrier: "InPost",
      serviceName: "Locker",
    });
    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const result = await new SendcloudAdapter().createLabel({
      quoteId: "sendcloud:27227",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      parcelTier: "small_parcel",
      weightKg: 1.2,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Road",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        validated: true,
      },
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "2 Road",
        city: "Manchester",
        postcode: "M1 1AE",
        country: "GB",
        validated: true,
      },
    });
    expect(result.available).toBe(true);
    expect(result.trackingNumber).toBe("TRACK1");
    expect(result.providerFailure).toBeUndefined();
  });

  it("G: failure response keeps order/payment mutation flags false", async () => {
    generateControlledLabelForRvx8343a7c7.mockResolvedValue(
      baseResult({
        sendcloudCalled: true,
        sendcloudHttpStatus: null,
        failureKind: "provider_transport",
        error: "transport",
        orderAmountMutated: false,
        paymentMutated: false,
        otherOrdersMutated: false,
      }),
    );
    const res = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/generate-label-rvx8343a7c7", {
        method: "POST",
      }),
    );
    const json = await res.json();
    expect(json.ORDER_AMOUNT_MUTATED).toBe(false);
    expect(json.PAYMENT_MUTATED).toBe(false);
    expect(json.OTHER_ORDERS_MUTATED).toBe(false);
    expect(res.status).toBe(502);
  });

  it("H: empty/no-tracking is distinguishable from transport failure", () => {
    const empty = shippingLabelProviderFailure({
      kind: "provider_empty_result",
      message: "Sendcloud returned no usable tracking number or label URL.",
      statusCode: null,
      providerRequestAttempted: true,
    });
    const transport = providerFailureFromUnknownError(
      new SendcloudError("network_error", "Sendcloud network error: reset"),
      true,
    );
    expect(empty.kind).toBe("provider_empty_result");
    expect(transport.kind).toBe("provider_transport");
    expect(empty.kind).not.toBe(transport.kind);
    expect(classifySendcloudErrorKind(
      new SendcloudError("label_failed", "Sendcloud shipment announced without a tracking number"),
    )).toBe("provider_empty_result");
  });

  it("I: secrets are not exposed in sanitized messages", () => {
    const sanitized = sanitizeProviderFailureMessage(
      "fail Bearer secret-token Basic YWRtaW46cGFzcw== sk_live_abc123 eyJhbGciOiJIUzI1NiJ9.aaa.bbb",
    );
    expect(sanitized).not.toContain("secret-token");
    expect(sanitized).not.toContain("YWRtaW46cGFzcw==");
    expect(sanitized).not.toContain("sk_live_abc123");
    expect(sanitized).toContain("[redacted]");
  });

  it("route: real provider HTTP 422 still maps to 422; null maps to 502", () => {
    expect(
      resolveControlledLabelHttpStatus(
        baseResult({
          sendcloudCalled: true,
          sendcloudHttpStatus: 422,
          failureKind: "provider_http",
          status: "sendcloud_rejected",
        }),
      ),
    ).toBe(422);
    expect(
      resolveControlledLabelHttpStatus(
        baseResult({
          sendcloudCalled: true,
          sendcloudHttpStatus: null,
          failureKind: "provider_empty_result",
        }),
      ),
    ).toBe(502);
    expect(
      resolveControlledLabelHttpStatus(
        baseResult({
          status: "preflight_blocked",
          failureKind: "rovexo_validation",
          sendcloudCalled: false,
        }),
      ),
    ).toBe(422);
  });

  it("router preserves providerFailure from adapter", async () => {
    generateLabel.mockRejectedValue(
      new SendcloudError("api_error", "panel said no", { statusCode: 409 }),
    );
    const { createShippingLabelRouted } = await import("@/lib/shipping/providers/router");
    const routed = await createShippingLabelRouted({
      quoteId: "sendcloud:27227",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      parcelTier: "small_parcel",
      weightKg: 1.2,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Road",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        validated: true,
      },
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "2 Road",
        city: "Manchester",
        postcode: "M1 1AE",
        country: "GB",
        validated: true,
      },
    });
    expect(routed.available).toBe(false);
    expect(routed.providerFailure?.statusCode).toBe(409);
    expect(routed.providerFailure?.message).toBe("panel said no");
    expect(routed.providerFailure?.providerRequestAttempted).toBe(true);
  });
});
