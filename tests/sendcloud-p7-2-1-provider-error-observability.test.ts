/**
 * P7.2.1 — Sendcloud 400 forensic observability (extract + sanitize only).
 * No live Sendcloud · no production endpoint · no order mutation.
 */
import { describe, expect, it } from "vitest";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import {
  buildSendcloudHttpFailureFromBody,
  extractSendcloudProviderErrorMessage,
  providerFailureFromUnknownError,
  sanitizeProviderDetails,
} from "@/lib/shipping/pricing/label-provider-failure-v1";
import { resolveControlledLabelHttpStatus } from "@/app/api/super-admin/shipping/generate-label-rvx8343a7c7/route";
import type { ControlledLabelRvx8343a7c7Result } from "@/lib/shipping/generate-label-rvx8343a7c7.server";
import { RVX8343A7C7_CONTROLLED_LABEL_V1 } from "@/lib/orders/rvx8343a7c7-controlled-label-v1";

const LOCK = RVX8343A7C7_CONTROLLED_LABEL_V1;

function baseResult(
  overrides: Partial<ControlledLabelRvx8343a7c7Result>,
): ControlledLabelRvx8343a7c7Result {
  return {
    ok: false,
    status: "sendcloud_rejected",
    orderId: LOCK.orderId,
    orderNumber: LOCK.orderNumber,
    shippingSetupStatus: "ready",
    shippingOptionCode: LOCK.confirmedShippingOptionCode,
    shippingRecordId: LOCK.expectedShippingRecordId,
    shippingQuoteRowId: LOCK.expectedShippingQuoteRowId,
    sendcloudCalled: true,
    sendcloudHttpStatus: 400,
    failureKind: "provider_http",
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

describe("P7.2.1 Sendcloud provider error observability", () => {
  it("preserves top-level message", () => {
    const body = { message: "shipping_option_code is not available for this route" };
    expect(extractSendcloudProviderErrorMessage(body)).toBe(
      "shipping_option_code is not available for this route",
    );
    const built = buildSendcloudHttpFailureFromBody(body);
    expect(built.message).toBe("shipping_option_code is not available for this route");
    expect(built.providerDetails).toEqual(body);
  });

  it("preserves detail", () => {
    const body = { detail: "to_address.postal_code is invalid" };
    expect(extractSendcloudProviderErrorMessage(body)).toBe("to_address.postal_code is invalid");
    const built = buildSendcloudHttpFailureFromBody(body);
    expect(built.providerDetails).toEqual({ detail: "to_address.postal_code is invalid" });
  });

  it("preserves errors array", () => {
    const body = {
      errors: [
        { field: "from_address.house_number", message: "required" },
        { field: "parcels.0.weight", message: "must be > 0" },
      ],
    };
    const message = extractSendcloudProviderErrorMessage(body);
    expect(message).toContain("from_address.house_number");
    expect(message).toContain("required");
    expect(message).toContain("parcels.0.weight");
    const built = buildSendcloudHttpFailureFromBody(body);
    expect(built.providerDetails).toEqual(body);
  });

  it("preserves body.error.message (V2 shape)", () => {
    expect(
      extractSendcloudProviderErrorMessage({
        error: { message: "Legacy nested message" },
      }),
    ).toBe("Legacy nested message");
  });

  it("provider HTTP 400 remains 400 through structured failure + route mapping", () => {
    const error = new SendcloudError("api_error", "panel rejection", {
      statusCode: 400,
      details: { message: "panel rejection", code: "invalid_request" },
    });
    const failure = providerFailureFromUnknownError(error, true);
    expect(failure.statusCode).toBe(400);
    expect(failure.kind).toBe("provider_http");
    expect(failure.message).toBe("panel rejection");
    expect(failure.providerDetails).toEqual({
      message: "panel rejection",
      code: "invalid_request",
    });

    expect(
      resolveControlledLabelHttpStatus(
        baseResult({
          sendcloudHttpStatus: 400,
          failureKind: "provider_http",
          providerDetails: failure.providerDetails ?? null,
          error: failure.message,
        }),
      ),
    ).toBe(400);
  });

  it("empty provider body does not invent an error message", () => {
    expect(extractSendcloudProviderErrorMessage(null)).toBeNull();
    expect(extractSendcloudProviderErrorMessage("")).toBeNull();
    expect(extractSendcloudProviderErrorMessage({})).toBeNull();

    const empty = buildSendcloudHttpFailureFromBody(null);
    expect(empty.message).toBe("");
    expect(empty.providerDetails).toBeNull();

    const blankObj = buildSendcloudHttpFailureFromBody({});
    expect(blankObj.message).toBe("");
    // empty object sanitizes to {} which is still a body shape with no inventing of text
    expect(blankObj.providerDetails).toEqual({});

    const error = new SendcloudError("api_error", "", {
      statusCode: 400,
      details: null,
    });
    const failure = providerFailureFromUnknownError(error, true);
    expect(failure.message).toBe("");
    expect(failure.statusCode).toBe(400);
    expect(failure.message).not.toContain("Sendcloud API error");
  });

  it("secrets are never propagated in message or details", () => {
    const body = {
      message: "fail Bearer secret-token Basic YWRtaW46cGFzcw== sk_live_abc123",
      authorization: "Basic YWRtaW46cGFzcw==",
      api_key: "pk_test_123",
      nested: { token: "eyJhbGciOiJIUzI1NiJ9.aaa.bbb", safe: "ok" },
    };
    const built = buildSendcloudHttpFailureFromBody(body);
    expect(built.message).not.toContain("secret-token");
    expect(built.message).not.toContain("sk_live_abc123");
    expect(built.message).toContain("[redacted]");

    const details = sanitizeProviderDetails(body) as Record<string, unknown>;
    expect(details.authorization).toBe("[redacted]");
    expect(details.api_key).toBe("[redacted]");
    expect((details.nested as Record<string, unknown>).token).toBe("[redacted]");
    expect((details.nested as Record<string, unknown>).safe).toBe("ok");
    expect(JSON.stringify(details)).not.toContain("YWRtaW46cGFzcw==");
  });

  it("field-map errors object is preserved", () => {
    const body = {
      errors: {
        to_address: ["postal_code invalid"],
        ship_with: ["shipping_option_code unknown"],
      },
    };
    const message = extractSendcloudProviderErrorMessage(body);
    expect(message).toContain("to_address");
    expect(message).toContain("postal_code invalid");
    expect(message).toContain("shipping_option_code unknown");
  });
});
