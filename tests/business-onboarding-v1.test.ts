import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_ONBOARDING_ENGINE,
  BUSINESS_TYPE_OPTIONS,
  deriveBusinessStripeState,
  isBusinessOnboardingComplete,
  isStripeBusinessVerified,
  resolveBusinessNextStep,
  resolveProfileBusinessAction,
  businessInformationSchema,
  type BusinessStripeStatus,
} from "@/lib/business/business-onboarding-contract-v1";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Business onboarding v1 — Stripe is the only verifier", () => {
  it("never treats form submit as verified", () => {
    expect(isStripeBusinessVerified("pending")).toBe(false);
    expect(isStripeBusinessVerified("action_required")).toBe(false);
    expect(isStripeBusinessVerified("not_started")).toBe(false);
    expect(isStripeBusinessVerified("verified")).toBe(true);
  });

  it("derives verified only from connected + payouts", () => {
    expect(
      deriveBusinessStripeState({
        accountIdPresent: true,
        connected: true,
        payoutsEnabled: true,
        currentlyDueCount: 0,
      }),
    ).toBe("verified");
    expect(
      deriveBusinessStripeState({
        accountIdPresent: true,
        connected: false,
        payoutsEnabled: false,
        currentlyDueCount: 2,
      }),
    ).toBe("action_required");
    expect(
      deriveBusinessStripeState({
        accountIdPresent: false,
        connected: false,
        payoutsEnabled: false,
        currentlyDueCount: 0,
      }),
    ).toBe("not_started");
  });

  it("routes onboarding without an extra upgrade screen", () => {
    expect(resolveBusinessNextStep({ hasBusinessProfile: false, stripeState: "not_started" })).toBe(
      "information",
    );
    expect(resolveBusinessNextStep({ hasBusinessProfile: true, stripeState: "pending" })).toBe("stripe");
    expect(resolveBusinessNextStep({ hasBusinessProfile: true, stripeState: "verified" })).toBe("home");
  });

  it("Profile Business action changes only when onboarding is fully complete", () => {
    const stripe = (overrides: Partial<BusinessStripeStatus>): BusinessStripeStatus => ({
      state: "not_started",
      verified: false,
      connected: false,
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: false,
      accountIdPresent: false,
      currentlyDueCount: 0,
      eventuallyDueCount: 0,
      disabledReason: null,
      ...overrides,
    });

    expect(isBusinessOnboardingComplete(null)).toBe(false);
    expect(
      isBusinessOnboardingComplete({
        hasBusinessProfile: true,
        stripe: stripe({ state: "pending", accountIdPresent: true }),
      }),
    ).toBe(false);
    expect(
      isBusinessOnboardingComplete({
        hasBusinessProfile: false,
        stripe: stripe({ state: "verified", verified: true, connected: true, payoutsEnabled: true }),
      }),
    ).toBe(false);

    const complete = {
      hasBusinessProfile: true,
      stripe: stripe({
        state: "verified" as const,
        verified: true,
        connected: true,
        payoutsEnabled: true,
        accountIdPresent: true,
      }),
      activeSellerContext: "individual" as const,
    };
    expect(isBusinessOnboardingComplete(complete)).toBe(true);
    expect(resolveProfileBusinessAction(null).title).toBe("Upgrade to Business");
    expect(
      resolveProfileBusinessAction({
        hasBusinessProfile: true,
        stripe: stripe({ state: "pending", accountIdPresent: true }),
        activeSellerContext: "individual",
      }).title,
    ).toBe("Upgrade to Business");
    expect(resolveProfileBusinessAction(complete)).toEqual({
      kind: "switch-to-business",
      emoji: "🔄",
      title: "Switch to Business",
    });
    expect(
      resolveProfileBusinessAction({ ...complete, activeSellerContext: "business" }),
    ).toEqual({
      kind: "switch-to-individual",
      emoji: "👤",
      title: "Switch to Individual",
    });
  });

  it("uses canonical business types only", () => {
    expect(BUSINESS_TYPE_OPTIONS.map((option) => option.id)).toEqual([
      "business_sole_trader",
      "business_company",
    ]);
    expect(businessInformationSchema.safeParse({
      businessName: "Oly Business",
      contactEmail: "oly@example.com",
      businessType: "business_sole_trader",
      addressLine: "10 Downing Street",
      city: "London",
      postcode: "SW1A 1AA",
      country: "United Kingdom",
    }).success).toBe(true);
    expect(
      businessInformationSchema.safeParse({
        businessName: "Oly Business",
        contactEmail: "oly@example.com",
        businessType: "personal",
        addressLine: "10 Downing Street",
        city: "London",
        postcode: "SW1A 1AA",
        country: "United Kingdom",
      }).success,
    ).toBe(false);
  });

  it("profile API never sets verified true on save", () => {
    const route = src("app/api/business/profile/route.ts");
    expect(route).toContain("verified: false");
    expect(route).not.toContain("verified_business: true");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain("verified_business: false");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain('verified_business: state === "verified"');
  });

  it("Connect uses existing Stripe engine and application responsibilities", () => {
    const connect = src("lib/stripe/connect.ts");
    expect(connect).toContain("fees_collector: \"application\"");
    expect(connect).toContain("losses_collector: \"application\"");
    expect(connect).toContain("ConnectAccountLinkOptions");
    expect(src("app/api/business/connect/route.ts")).toContain("startBusinessStripeConnect");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain("createConnectAccountLink(userId, \"business\"");
  });

  it("does not add ROVEXO KYC / proof-of-business screens", () => {
    const engine = src("lib/business/business-onboarding-v1.ts");
    expect(engine).not.toContain("Proof of Business");
    expect(engine).not.toContain("Photo ID");
    expect(src("features/business/onboarding/BusinessInformationForm.tsx")).not.toContain(
      "Proof of Business",
    );
  });

  it("switch only writes active_seller_context", () => {
    const engine = src("lib/business/business-onboarding-v1.ts");
    const route = src("app/api/business/context/route.ts");
    expect(engine).toContain("active_seller_context: next");
    expect(engine).toContain("SELLER_CONTEXT_WRITE_FAILED");
    expect(engine).toContain("loadBusinessStripeStatus(userId, { refresh: false })");
    expect(engine).not.toContain("delete().eq(\"id\", userId)");
    expect(route).toContain("Stripe verification is required.");
    expect(route).toContain("Seller context could not be saved.");
    expect(route).toContain("auth.user.id");
    expect(route).not.toContain("body.userId");
    expect(BUSINESS_ONBOARDING_ENGINE).toBe("business-onboarding-v1");
  });

  it("Stripe return bridge never writes verified state", () => {
    const ret = src("app/api/business/connect/return/route.ts");
    expect(ret).toContain("rovexo://business/connect");
    expect(ret).not.toContain("verified_business");
    expect(ret).not.toContain("payoutsEnabled");
  });

  it("reuses canonical inventory, directory, wallet, and addresses", () => {
    expect(src("app/api/business/inventory/route.ts")).toContain("getInventoryOverview");
    expect(src("app/api/business/directory/route.ts")).toContain("listBusinessDirectory");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain("getWalletData(userId, \"business\")");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain("createUserAddress");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain("ADDRESS_SCOPE_TO_STORAGE.business");
    expect(src("lib/business/directory.ts")).not.toContain('.eq("role", "business")');
    expect(src("lib/business/directory.ts")).toContain('.eq("verified_business", true)');
    expect(src("app/(platform)/business/directory/page.tsx")).toContain("getBusinessProfile");
    expect(src("app/api/business/inventory/route.ts")).toContain("!status.stripe.verified");
    expect(src("app/api/business/inventory/route.ts")).toContain(
      "status.activeSellerContext !== \"business\"",
    );
    expect(src("lib/business/pwa-business-session.ts")).toContain(
      "if (currentContext === \"business\") return",
    );
  });

  it("does not retrieve Stripe on cached Business status reads", () => {
    const engine = src("lib/business/business-onboarding-v1.ts");
    expect(engine).toContain("options?.lite === true");
    expect(engine).toContain("syncConnectAccountBySellerId(userId, \"business\")");
    expect(engine).not.toContain("getConnectAccountStatus(userId, \"business\")");
    expect(src("app/(platform)/account/page.tsx")).toContain("lite: true");
  });

  it("webhook sync writes verified_business from Stripe only", () => {
    const connect = src("lib/stripe/connect.ts");
    expect(connect).toContain("verified_business: verified");
    expect(connect).toContain("status.payoutsEnabled && status.connected");
    expect(connect).toContain("const methodConnected =");
    expect(connect).toContain("const verified = methodConnected");
  });
});
