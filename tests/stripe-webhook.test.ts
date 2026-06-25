import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/stripe/server", () => ({
  isStripeConfigured: vi.fn(() => true),
  getStripeClient: vi.fn(),
  getStripeWebhookSecret: vi.fn(() => "whsec_test"),
}));

vi.mock("@/lib/stripe/webhook-handler", () => ({
  handleStripeWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("Stripe webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 405 Method Not Allowed", async () => {
    const { GET } = await import("@/app/api/stripe/webhook/route");
    const response = await GET();
    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.error).toBe("Method Not Allowed");
  });

  it("POST returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("POST returns 400 on invalid signature", async () => {
    const { getStripeClient } = await import("@/lib/stripe/server");
    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error("Invalid signature");
        }),
      },
    } as never);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "invalid" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("POST returns 200 after successful event processing", async () => {
    const { getStripeClient } = await import("@/lib/stripe/server");
    const { handleStripeWebhookEvent } = await import("@/lib/stripe/webhook-handler");

    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => ({
          id: "evt_test",
          type: "checkout.session.completed",
          data: { object: {} },
        })),
      },
    } as never);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig_test" },
        body: '{"id":"evt_test"}',
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);
    expect(handleStripeWebhookEvent).toHaveBeenCalledOnce();
  });
});
