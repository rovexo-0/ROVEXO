/**
 * Phase 2C.3 — Accounts V2 status mapping + Connect sync contracts.
 * Mocks only — STRIPE API CALLS = 0 · DB WRITES = 0.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type Stripe from "stripe";
import {
  mapV2RecipientStatus,
  V2_CONNECT_STATUS_INCLUDES,
} from "@/lib/stripe/connect-v2-recipient-status";
import { extractConnectAccountIdFromEvent } from "@/lib/stripe/connect";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

function v2Account(
  overrides: Record<string, unknown> = {},
): Stripe.V2.Core.Account {
  return {
    id: "acct_v2_test",
    object: "v2.core.account",
    applied_configurations: ["recipient"],
    created: "2026-01-01T00:00:00.000Z",
    livemode: false,
    metadata: { sellerId: "seller-1", sellerContext: "individual" },
    configuration: {
      recipient: {
        applied: true,
        capabilities: {
          stripe_balance: {
            payouts: { status: "active", status_details: [] },
            stripe_transfers: { status: "active", status_details: [] },
          },
        },
      },
    },
    requirements: { entries: [] },
    ...overrides,
  } as Stripe.V2.Core.Account;
}

describe("mapV2RecipientStatus", () => {
  it("1 recipient active → connected=true, payouts=true, charges=false", () => {
    const s = mapV2RecipientStatus(v2Account());
    expect(s).toEqual({
      connected: true,
      payoutsEnabled: true,
      chargesEnabled: false,
    });
  });

  it("2 onboarding incomplete → connected=false", () => {
    const s = mapV2RecipientStatus(
      v2Account({
        applied_configurations: [],
        configuration: {
          recipient: {
            applied: false,
            capabilities: {
              stripe_balance: {
                payouts: { status: "pending", status_details: [] },
              },
            },
          },
        },
      }),
    );
    expect(s.connected).toBe(false);
    expect(s.payoutsEnabled).toBe(false);
    expect(s.chargesEnabled).toBe(false);
  });

  it("3 payouts inactive → payoutsEnabled=false", () => {
    const s = mapV2RecipientStatus(
      v2Account({
        configuration: {
          recipient: {
            applied: true,
            capabilities: {
              stripe_balance: {
                payouts: { status: "restricted", status_details: [] },
                stripe_transfers: { status: "active", status_details: [] },
              },
            },
          },
        },
      }),
    );
    expect(s.connected).toBe(true);
    expect(s.payoutsEnabled).toBe(false);
  });

  it("4 recipient applied but payout pending → no false payout readiness", () => {
    const s = mapV2RecipientStatus(
      v2Account({
        configuration: {
          recipient: {
            applied: true,
            capabilities: {
              stripe_balance: {
                payouts: { status: "pending", status_details: [] },
              },
            },
          },
        },
      }),
    );
    expect(s.payoutsEnabled).toBe(false);
    expect(s.chargesEnabled).toBe(false);
  });

  it("5 blocking requirements → connected=false", () => {
    const s = mapV2RecipientStatus(
      v2Account({
        requirements: {
          entries: [
            {
              awaiting_action_from: "user",
              description: "identity.document",
              errors: [],
              impact: {
                restricts_capabilities: [
                  {
                    capability: "stripe_balance.payouts",
                    configuration: "recipient",
                  },
                ],
              },
              minimum_deadline: { status: "currently_due" },
              requested_reasons: [],
            },
          ],
        },
      }),
    );
    expect(s.connected).toBe(false);
  });

  it("5b eventually_due identity verification must NOT force inactive while caps ACTIVE", () => {
    const s = mapV2RecipientStatus(
      v2Account({
        requirements: {
          entries: [
            {
              awaiting_action_from: "user",
              description: "identity.individual.verification.document",
              errors: [
                {
                  code: "verification_failed_keyed_identity",
                  reason:
                    "The identity information you entered cannot be verified",
                },
              ],
              impact: {
                restricts_capabilities: [
                  {
                    capability: "stripe_balance.stripe_transfers",
                    configuration: "recipient",
                  },
                ],
              },
              minimum_deadline: { status: "eventually_due" },
              requested_reasons: [],
            },
          ],
        },
      }),
    );
    expect(s.connected).toBe(true);
    expect(s.payoutsEnabled).toBe(true);
    expect(s.chargesEnabled).toBe(false);
  });

  it("11 chargesEnabled false for recipient-only", () => {
    expect(mapV2RecipientStatus(v2Account()).chargesEnabled).toBe(false);
  });

  it("retrieve includes are SDK AccountRetrieveParams.Include values", () => {
    expect([...V2_CONNECT_STATUS_INCLUDES]).toEqual([
      "configuration.recipient",
      "requirements",
    ]);
  });
});

describe("extractConnectAccountIdFromEvent", () => {
  it("prefers data.object.id", () => {
    expect(
      extractConnectAccountIdFromEvent({
        account: "acct_evt",
        data: { object: { id: "acct_obj" } },
      } as Stripe.Event),
    ).toBe("acct_obj");
  });

  it("falls back to event.account", () => {
    expect(
      extractConnectAccountIdFromEvent({
        account: "acct_evt",
        data: { object: {} },
      } as Stripe.Event),
    ).toBe("acct_evt");
  });
});

describe("Connect V2 architecture contracts (source)", () => {
  it("status path uses V2 retrieve + mapper; no V1 capability fields", () => {
    const connect = read("lib/stripe/connect.ts");
    expect(connect).toContain("stripe.v2.core.accounts.retrieve");
    expect(connect).toContain("mapV2RecipientStatus");
    expect(connect).toContain("V2_CONNECT_STATUS_INCLUDES");
    expect(connect).not.toMatch(/account\.payouts_enabled/);
    expect(connect).not.toMatch(/account\.details_submitted/);
    expect(connect).not.toMatch(/account\.charges_enabled/);
    expect(connect).not.toMatch(/stripe\.accounts\.retrieve\(/);
  });

  it("6 Individual dual-write preserved", () => {
    const connect = read("lib/stripe/connect.ts");
    expect(connect).toContain('context === "individual"');
    expect(connect).toContain("stripe_connect_account_id");
    expect(connect).toContain("connectAccountColumn");
    expect(connect).toContain("connectCapabilityColumns");
  });

  it("7 Business column path present; dual-write gated to individual", () => {
    const connect = read("lib/stripe/connect.ts");
    expect(connect).toContain("stripe_connect_account_id_business");
    expect(connect).toMatch(
      /if \(context === "individual"\)[\s\S]*?stripe_connect_account_id\s*=/,
    );
  });

  it("8 missing metadata sellerId → early return", () => {
    const connect = read("lib/stripe/connect.ts");
    expect(connect).toContain("account.metadata?.sellerId");
    expect(connect).toMatch(/if \(!sellerId\) \{\s*return;/);
  });

  it("webhook account.updated uses V2 account-id retrieve strategy", () => {
    const webhook = read("lib/stripe/webhook-handler.ts");
    expect(webhook).toContain("extractConnectAccountIdFromEvent");
    expect(webhook).toContain("syncConnectAccountFromStripeAccountId");
    expect(webhook).not.toMatch(
      /syncConnectAccountFromStripe\(\s*event\.data\.object as Stripe\.Account\s*\)/,
    );
  });

  it("9 duplicate webhook protection retained", () => {
    const webhook = read("lib/stripe/webhook-handler.ts");
    expect(webhook).toContain("stripe_webhook_events");
    expect(webhook).toContain("23505");
    expect(webhook).toContain("Duplicate webhook skipped");
  });

  it("creation/links remain V2; withdraw transfers untouched", () => {
    const connect = read("lib/stripe/connect.ts");
    expect(connect).toContain("stripe.v2.core.accounts.create");
    expect(connect).toContain("stripe.v2.core.accountLinks.create");
    expect(connect).toContain('configurations: ["recipient"]');
    expect(connect).toContain("identity:");
    expect(connect).toContain("resolveConnectIdentityCountry");
    expect(connect).toContain("seller_tax_profiles");
    expect(connect).toContain("stripe_transfers");
    expect(connect).toContain("requested: true");
    expect(connect).toContain('dashboard: "express"');
    expect(connect).toContain('currency: "gbp"');
    // Business CREATE must include responsibilities (Stripe reject without them).
    expect(connect).toContain('normalized === "business"');
    expect(connect).toContain('fees_collector: "application"');
    expect(connect).toContain('losses_collector: "application"');
    expect(connect).toContain("responsibilities:");
    expect(connect).not.toMatch(/configuration:\s*\{\s*recipient:\s*\{\s*\}/);
    const withdraw = read("lib/stripe/withdraw-payout.ts");
    expect(withdraw).toContain("transfers.create");
    expect(withdraw).not.toContain("v2.core.accounts");
  });

  it("12 Buyer Protection file remains present and independent", () => {
    const bp = read("lib/orders/buyer-protection-refund-v1.ts");
    expect(bp.length).toBeGreaterThan(500);
    expect(bp).toMatch(/Buyer Protection|protected_fee|mapRovexoRefund|calculateRovexoRefund/i);
  });
});

describe("syncConnectAccountFromStripe persistence (mocked)", () => {
  const sellerUpdate = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  const taxUpdate = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  const businessUpdate = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  const withdrawUpdate = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    })),
  }));
  const withdrawInsert = vi.fn(async () => ({ error: null }));
  const withdrawSelectChain = {
    eq: vi.fn(function eq() {
      return withdrawSelectChain;
    }),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    withdrawSelectChain.eq = vi.fn(function eq() {
      return withdrawSelectChain;
    });
    withdrawSelectChain.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: (table: string) => {
          if (table === "seller_profiles") return { update: sellerUpdate };
          if (table === "seller_tax_profiles") return { update: taxUpdate };
          if (table === "withdraw_methods") {
            return {
              select: () => withdrawSelectChain,
              update: withdrawUpdate,
              insert: withdrawInsert,
            };
          }
          if (table === "business_accounts") return { update: businessUpdate };
          throw new Error(`unexpected table ${table}`);
        },
      }),
      tryCreateAdminClient: () => true,
    }));
    vi.doMock("@/lib/stripe/server", () => ({
      isStripeConfigured: () => true,
      getStripeClient: () => ({}),
      getAppBaseUrl: () => "http://localhost:3000",
    }));
  });

  it("6 Individual patch includes dual-write + charges false", async () => {
    const { syncConnectAccountFromStripe } = await import("@/lib/stripe/connect");
    await syncConnectAccountFromStripe(v2Account(), "individual");
    const patch = sellerUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(patch.stripe_connect_account_id_individual).toBe("acct_v2_test");
    expect(patch.stripe_connect_account_id).toBe("acct_v2_test");
    expect(patch.stripe_connect_charges_enabled_individual).toBe(false);
    expect(patch.stripe_connect_payouts_enabled_individual).toBe(true);
    expect(patch.stripe_connect_details_submitted_individual).toBe(true);
    expect(businessUpdate).not.toHaveBeenCalled();
    expect(withdrawInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "stripe_connect",
        seller_context: "individual",
        connected: true,
      }),
    );
  });

  it("7 Business patch has no legacy individual dual-write", async () => {
    const { syncConnectAccountFromStripe } = await import("@/lib/stripe/connect");
    await syncConnectAccountFromStripe(
      v2Account({
        metadata: { sellerId: "seller-1", sellerContext: "business" },
      }),
      "business",
    );
    const patch = sellerUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(patch.stripe_connect_account_id_business).toBe("acct_v2_test");
    expect(patch.stripe_connect_account_id).toBeUndefined();
    expect(patch.stripe_connect_charges_enabled_business).toBe(false);
    expect(businessUpdate.mock.calls[0]?.[0]).toEqual({ verified_business: true });
    expect(withdrawInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "stripe_connect",
        seller_context: "business",
        connected: true,
      }),
    );
  });

  it("8 missing sellerId → no DB writes", async () => {
    const { syncConnectAccountFromStripe } = await import("@/lib/stripe/connect");
    await syncConnectAccountFromStripe(v2Account({ metadata: {} }));
    expect(sellerUpdate).not.toHaveBeenCalled();
    expect(businessUpdate).not.toHaveBeenCalled();
    expect(withdrawInsert).not.toHaveBeenCalled();
  });
});

describe("10 V2 retrieve failure fails closed", () => {
  it("returns false flags and does not mutate seller_profiles", async () => {
    vi.resetModules();
    const update = vi.fn();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: (table: string) => {
          if (table === "seller_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      stripe_connect_account_id_individual: "acct_v2_test",
                      stripe_connect_account_id: "acct_v2_test",
                    },
                    error: null,
                  }),
                }),
              }),
              update,
            };
          }
          return {
            update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
          };
        },
      }),
      tryCreateAdminClient: () => true,
    }));
    vi.doMock("@/lib/stripe/server", () => ({
      isStripeConfigured: () => true,
      getStripeClient: () => ({
        v2: {
          core: {
            accounts: {
              retrieve: vi.fn(async () => {
                throw new Error("stripe unavailable");
              }),
            },
          },
        },
      }),
      getAppBaseUrl: () => "http://localhost:3000",
    }));

    const { syncConnectAccountBySellerId } = await import("@/lib/stripe/connect");
    const result = await syncConnectAccountBySellerId("seller-1", "individual");
    expect(result).toMatchObject({
      connected: false,
      payoutsEnabled: false,
      chargesEnabled: false,
      accountId: "acct_v2_test",
    });
    expect(update).not.toHaveBeenCalled();
  });
});
