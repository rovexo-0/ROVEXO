import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isBusinessOnboardingComplete,
  resolveProfileBusinessAction,
} from "@/lib/business/business-onboarding-contract-v1";
import { isSellerContext, normalizeSellerContext } from "@/lib/seller-context/seller-context-v1";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function stripe(verified: boolean) {
  return {
    state: verified ? ("verified" as const) : ("action_required" as const),
    verified,
    connected: verified,
    payoutsEnabled: verified,
    chargesEnabled: verified,
    detailsSubmitted: verified,
    accountIdPresent: true,
    currentlyDueCount: verified ? 0 : 3,
    eventuallyDueCount: 0,
    disabledReason: null,
  };
}

describe("Business seller context switch contract", () => {
  it("A/B complete Business shows switch, never Upgrade", () => {
    const complete = {
      hasBusinessProfile: true,
      stripe: stripe(true),
      activeSellerContext: "individual" as const,
    };
    expect(isBusinessOnboardingComplete(complete)).toBe(true);
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

  it("C unverified Business cannot switch — Stripe gate", () => {
    const unverified = {
      hasBusinessProfile: true,
      stripe: stripe(false),
      activeSellerContext: "individual" as const,
    };
    expect(isBusinessOnboardingComplete(unverified)).toBe(false);
    expect(resolveProfileBusinessAction(unverified).kind).toBe("upgrade");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain("STRIPE_VERIFICATION_REQUIRED");
    expect(src("app/api/business/context/route.ts")).toContain('status: 409');
    expect(src("app/api/business/context/route.ts")).toContain("Stripe verification is required.");
  });

  it("D wrong user/profile cannot be supplied in the body", () => {
    const route = src("app/api/business/context/route.ts");
    expect(route).toContain("requireApiAuth");
    expect(route).toContain("auth.user.id");
    expect(route).not.toContain("body.userId");
    expect(route).not.toContain("body.sellerId");
    expect(src("e2e/business-onboarding-auth.spec.ts")).toContain(
      "PATCH /api/business/context requires authentication",
    );
  });

  it("E invalid seller_context is rejected", () => {
    expect(isSellerContext("business")).toBe(true);
    expect(isSellerContext("individual")).toBe(true);
    expect(isSellerContext("company")).toBe(false);
    expect(isSellerContext("")).toBe(false);
    expect(normalizeSellerContext("nope")).toBe("individual");
    expect(src("app/api/business/context/route.ts")).toContain('z.enum(["individual", "business"])');
    expect(src("app/api/business/context/route.ts")).toContain("Invalid seller context.");
  });

  it("F database write failure must not return success", () => {
    const engine = src("lib/business/business-onboarding-v1.ts");
    const route = src("app/api/business/context/route.ts");
    expect(engine).toContain("SELLER_CONTEXT_WRITE_FAILED");
    expect(engine).toContain('.select("id, active_seller_context")');
    expect(route).toContain("Seller context could not be saved.");
    expect(route).toContain("status: 500");
    expect(route).not.toMatch(/catch[\s\S]*success:\s*true/);
  });

  it("G/H persistence uses one seller_profiles.active_seller_context column", () => {
    const engine = src("lib/business/business-onboarding-v1.ts");
    const migration = src("supabase/migrations/20260902180000_seller_profiles_active_seller_context_v1.sql");
    expect(engine).toContain("active_seller_context");
    expect(engine).not.toContain("from(\"seller_context\")");
    expect(migration).toContain("add column if not exists active_seller_context text");
    expect(migration).toContain("check (active_seller_context in ('individual', 'business'))");
  });

  it("I Business authorization stays Stripe-gated and isolated", () => {
    const engine = src("lib/business/business-onboarding-v1.ts");
    expect(engine).toContain("if (next === \"business\")");
    expect(engine).toContain("loadBusinessStripeStatus(userId, { refresh: false })");
    expect(engine).toContain("verified_business: state === \"verified\"");
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).toContain(
      "navigateAfterSellerContextSwitch",
    );
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).toContain(
      "requestSellerContextSwitch",
    );
    expect(src("lib/business/switch-seller-context-client.ts")).toContain(
      "router.push(href)",
    );
    expect(src("lib/business/switch-seller-context-client.ts")).toContain(
      "BUSINESS_DASHBOARD_ROUTE",
    );
  });

  it("J successful switch navigates; failed switch stays on Account", () => {
    const card = src("features/business/onboarding/BusinessUpgradeCard.tsx");
    const client = src("lib/business/switch-seller-context-client.ts");
    const menu = src("features/business/onboarding/BusinessMenuScreen.tsx");
    const dashboard = src("app/(platform)/business/dashboard/page.tsx");
    expect(client).toContain('return context === "business" ? BUSINESS_DASHBOARD_ROUTE : INDIVIDUAL_ACCOUNT_ROUTE');
    expect(client).toContain("router.push(href)");
    expect(client).not.toContain("window.location");
    expect(card).toContain("if (!result.ok)");
    expect(card).toContain("pushToast");
    const handler = card.slice(card.indexOf("async function switchContext"));
    expect(handler.indexOf("if (!result.ok)")).toBeLessThan(
      handler.indexOf("navigateAfterSellerContextSwitch"),
    );
    expect(card).not.toContain("/business/menu");
    expect(menu).toContain("navigateAfterSellerContextSwitch");
    expect(menu).not.toContain("router.refresh()");
    expect(dashboard).not.toContain("throw error");
    expect(dashboard).toContain("Do not abort Business Home");
  });

  it("K Account remount/pageshow/visibility re-reads canonical status — no stale Business label", () => {
    const card = src("features/business/onboarding/BusinessUpgradeCard.tsx");
    const client = src("lib/business/switch-seller-context-client.ts");
    expect(client).toContain("rememberConfirmedSellerContext(json.activeSellerContext)");
    expect(client).toContain("SELLER_CONTEXT_CHANGED_EVENT");
    expect(card).toContain("applyConfirmedSellerContextHint");
    expect(card).toContain('if (pathname !== "/account") return');
    expect(card).toContain("void refreshStatus()");
    expect(card).toContain('fetch("/api/business/status"');
    expect(card).toContain('cache: "no-store"');
    expect(card).toContain("statusInFlight.current");
    expect(card).toContain('addEventListener("pageshow"');
    expect(card).toContain('addEventListener("visibilitychange"');
    expect(card).toContain("SELLER_CONTEXT_CHANGED_EVENT");
    expect(card).not.toContain("setInterval");
    expect(card).not.toContain("router.refresh()");
    const handler = card.slice(card.indexOf("async function switchContext"));
    expect(handler.indexOf("if (!result.ok)")).toBeLessThan(
      handler.indexOf("setLiveStatus((current) =>"),
    );
    expect(src("features/account-center/components/AccountCenterHome.tsx")).toContain(
      "BusinessUpgradeCard",
    );
  });
});
