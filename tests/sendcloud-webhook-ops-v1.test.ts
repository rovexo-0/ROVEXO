import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { verifySendcloudWebhookRequest } from "@/lib/shipping/sendcloud/webhooks";

describe("Sendcloud webhook ops fail-closed", () => {
  const originalSecret = process.env.SENDCLOUD_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SENDCLOUD_WEBHOOK_SECRET;
    else process.env.SENDCLOUD_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects when SENDCLOUD_WEBHOOK_SECRET is missing", () => {
    delete process.env.SENDCLOUD_WEBHOOK_SECRET;
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
      headers: { "sendcloud-signature": "anything" },
    });
    expect(verifySendcloudWebhookRequest(request, "{}")).toBe(false);
  });

  it("rejects when signature header is missing", () => {
    process.env.SENDCLOUD_WEBHOOK_SECRET = "ops_test_secret_not_real";
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
    });
    expect(verifySendcloudWebhookRequest(request, "{\"parcel\":{}}")).toBe(false);
  });

  it("rejects invalid signatures", () => {
    process.env.SENDCLOUD_WEBHOOK_SECRET = "ops_test_secret_not_real";
    const body = "{\"parcel\":{\"tracking_number\":\"TEST\"}}";
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
      headers: { "sendcloud-signature": "deadbeef" },
    });
    expect(verifySendcloudWebhookRequest(request, body)).toBe(false);
  });

  it("accepts valid HMAC-SHA256 signatures", () => {
    const secret = "ops_test_secret_not_real";
    process.env.SENDCLOUD_WEBHOOK_SECRET = secret;
    const body = "{\"parcel\":{\"tracking_number\":\"TEST\"}}";
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
      headers: { "sendcloud-signature": digest },
    });
    expect(verifySendcloudWebhookRequest(request, body)).toBe(true);
  });
});
