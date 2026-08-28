import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SELLER_ID = "22222222-2222-4222-8222-222222222222";
const OFFER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OFFERS_URL = "https://www.rovexo.co.uk/api/offers";

const {
  verifyBearerAccessToken,
  createVerifiedBearerUserClient,
  validateMutationOrigin,
  enforceRateLimitForUser,
  detectSelfOffer,
  isSelfPurchaseBlocked,
  emitSmartNotification,
} = vi.hoisted(() => ({
  verifyBearerAccessToken: vi.fn(),
  createVerifiedBearerUserClient: vi.fn(),
  validateMutationOrigin: vi.fn(),
  enforceRateLimitForUser: vi.fn(),
  detectSelfOffer: vi.fn(),
  isSelfPurchaseBlocked: vi.fn(),
  emitSmartNotification: vi.fn(),
}));

vi.mock("@/lib/auth/verify-bearer-access-token-v1", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/verify-bearer-access-token-v1")>();
  return {
    ...actual,
    verifyBearerAccessToken,
    createVerifiedBearerUserClient,
  };
});

vi.mock("@/lib/api/csrf-guard", () => ({
  validateMutationOrigin,
}));

vi.mock("@/lib/api/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/rate-limit")>();
  return {
    ...actual,
    enforceRateLimitForUser,
  };
});

vi.mock("@/lib/trust/anti-fraud", () => ({
  detectSelfOffer,
}));

vi.mock("@/lib/checkout/self-purchase-absolute-law-v1", () => ({
  isSelfPurchaseBlocked,
}));

vi.mock("@/lib/notifications/events", () => ({
  emitSmartNotification,
}));

import { POST as postOffer } from "@/app/api/offers/route";

function listingClient(price = 1) {
  return {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { account_status: "active", role: "buyer" },
              }),
            }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "prod-1",
                  slug: "pound-listing",
                  title: "Test listing",
                  price,
                  status: "published",
                  accept_offers: true,
                  seller_id: SELLER_ID,
                  product_images: [],
                },
              }),
            }),
          }),
        };
      }
      if (table === "offers") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: OFFER_ID }, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

function bearerOffer(body: unknown) {
  return new Request(OFFERS_URL, {
    method: "POST",
    headers: {
      host: "www.rovexo.co.uk",
      origin: "https://www.rovexo.co.uk",
      authorization: "Bearer valid-native-jwt",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Native Make Offer amount vs listing price", () => {
  beforeEach(() => {
    verifyBearerAccessToken.mockReset();
    createVerifiedBearerUserClient.mockReset();
    validateMutationOrigin.mockReset();
    enforceRateLimitForUser.mockReset();
    detectSelfOffer.mockReset();
    isSelfPurchaseBlocked.mockReset();
    emitSmartNotification.mockReset();
    verifyBearerAccessToken.mockResolvedValue({ id: USER_ID, email: "native@rovexo.co.uk" });
    createVerifiedBearerUserClient.mockReturnValue(listingClient(1));
    validateMutationOrigin.mockResolvedValue(null);
    enforceRateLimitForUser.mockResolvedValue(null);
    detectSelfOffer.mockResolvedValue({ blocked: false });
    isSelfPurchaseBlocked.mockReturnValue(false);
  });

  it("accepts £1.20 on a £1.00 listing", async () => {
    const response = await postOffer(
      bearerOffer({ productSlug: "pound-listing", amount: 1.2, conversationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.offerId).toBe(OFFER_ID);
  });

  it("still rejects non-positive amounts", async () => {
    const zero = await postOffer(bearerOffer({ productSlug: "pound-listing", amount: 0 }));
    expect(zero.status).toBe(400);
    const negative = await postOffer(bearerOffer({ productSlug: "pound-listing", amount: -1 }));
    expect(negative.status).toBe(400);
    const missing = await postOffer(bearerOffer({ productSlug: "pound-listing" }));
    expect(missing.status).toBe(400);
  });
});
