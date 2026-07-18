import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FULL_DEMO_ORDER_STATUS_SPECS } from "@/lib/demo-environment/full-demo-marketplace";
import { DEMO_USERS } from "@/lib/demo-environment/config";
import { listLaunchDemoAccounts } from "@/lib/launch-certification/demo-accounts";
import {
  mustUseDemoShipping,
  mustUseVirtualPayments,
  mustUseVirtualWallet,
  resolveFullDemoSecuritySnapshot,
} from "@/lib/full-demo/security";
import {
  FULL_DEMO_ACCOUNTS,
  FULL_DEMO_BUYER_CERT_FLOW,
  FULL_DEMO_BUYER_QUOTAS,
  FULL_DEMO_CERTIFICATION_SURFACES,
  FULL_DEMO_MANDATORY_E2E_STEPS,
  FULL_DEMO_ORDER_STATES,
  FULL_DEMO_PARCEL_SPECS,
  FULL_DEMO_PERMANENCE_CONTRACT,
  FULL_DEMO_PREDEPLOY_GATES,
  FULL_DEMO_PRODUCT_TARGET,
  FULL_DEMO_RELEASE_REQUIREMENTS,
  FULL_DEMO_SELLER_CERT_FLOW,
  FULL_DEMO_SELLER_QUOTAS,
  FULL_DEMO_VERSION,
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
  isFullDemoEmail,
  listFullDemoAccounts,
} from "@/lib/full-demo/canonical";
import {
  isFullDemoCertificationPassed,
  isLiveDeploymentAllowed,
  runFullDemoCertificationScan,
} from "@/lib/full-demo/deploy-gate";
import {
  assertDeploymentCertificationPassed,
  isDeploymentCertificationPassed,
  runDeploymentCertificationScan,
} from "@/lib/full-demo/deployment-certification";
import {
  ReleaseOverrideForbiddenError,
  assertNoDeploymentOverrideEnv,
  assertNoDeploymentOverridePayload,
  assertReleaseProtectionNoOverride,
  isExactHundredPercentPass,
} from "@/lib/full-demo/no-override";
import {
  assertFullDemoActionAllowed,
  assertFullDemoNotDeletable,
  FullDemoPermanenceError,
} from "@/lib/full-demo/permanence";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Full Demo Certification Mode", () => {
  it("locks two permanent Full Demo Accounts with £50,000 virtual funds", () => {
    expect(FULL_DEMO_VERSION).toBe("v1.0");
    expect(FULL_DEMO_ACCOUNTS).toHaveLength(2);
    expect(FULL_DEMO_VIRTUAL_FUNDS_GBP).toBe(50_000);
    expect(FULL_DEMO_PRODUCT_TARGET).toBeGreaterThanOrEqual(100);
    expect(FULL_DEMO_PERMANENCE_CONTRACT.neverDelete).toBe(true);
    expect(FULL_DEMO_PERMANENCE_CONTRACT.neverExpire).toBe(true);
    expect(FULL_DEMO_PERMANENCE_CONTRACT.neverDisable).toBe(true);
    expect(FULL_DEMO_PERMANENCE_CONTRACT.neverSuspend).toBe(true);
    expect(FULL_DEMO_PERMANENCE_CONTRACT.neverReset).toBe(true);
    expect(FULL_DEMO_PERMANENCE_CONTRACT.noRealMoneyRequired).toBe(true);

    const [buyer, seller] = listFullDemoAccounts();
    expect(buyer?.key).toBe("live-buyer");
    expect(buyer?.label).toBe("ROVEXO LIVE BUYER");
    expect(buyer?.email).toBe("demo.buyer@rovexo.co.uk");
    expect(buyer?.virtualFundsGbp).toBe(50_000);

    expect(seller?.key).toBe("live-seller");
    expect(seller?.label).toBe("ROVEXO LIVE SELLER");
    expect(seller?.email).toBe("demo.seller@rovexo.co.uk");
    expect(seller?.verified.business).toBe(true);
  });

  it("locks buyer and seller inventory quotas from the Full Demo contract", () => {
    expect(FULL_DEMO_BUYER_QUOTAS).toMatchObject({
      virtualBalanceGbp: 50_000,
      completedOrders: 100,
      cancelledOrders: 50,
      refundedOrders: 50,
      deliveredOrders: 50,
      disputes: 50,
    });
    expect(FULL_DEMO_SELLER_QUOTAS).toMatchObject({
      virtualBalanceGbp: 50_000,
      products: 100,
      completedSales: 100,
      cancelledSales: 50,
      refundedSales: 50,
      offers: 40,
      counterOffers: 20,
      disputes: 50,
      promotions: 10,
      analyticsEvents: 50,
    });
  });

  it("defines buyer/seller certification flows and release requirements", () => {
    expect(FULL_DEMO_MANDATORY_E2E_STEPS).toHaveLength(25);
    expect(FULL_DEMO_PREDEPLOY_GATES).toHaveLength(20);
    expect(FULL_DEMO_BUYER_CERT_FLOW).toEqual([
      "login",
      "buy",
      "checkout",
      "wallet",
      "tracking",
      "delivered",
      "review",
      "completed",
    ]);
    expect(FULL_DEMO_SELLER_CERT_FLOW).toEqual([
      "login",
      "receive_offer",
      "accept_offer",
      "generate_label",
      "tracking",
      "delivered",
      "wallet_payout",
      "completed",
    ]);
    expect(FULL_DEMO_RELEASE_REQUIREMENTS).toEqual([
      "demo_certification_passed",
      "authentication_passed",
      "orders_passed",
      "wallet_passed",
      "tracking_passed",
      "checkout_passed",
      "responsive_passed",
      "performance_passed",
    ]);
  });

  it("includes Full Demo Accounts in DEMO_USERS and launch certification mapping", () => {
    expect(DEMO_USERS.map((u) => u.key)).toContain("live-buyer");
    expect(DEMO_USERS.map((u) => u.key)).toContain("live-seller");
    expect(DEMO_USERS.length).toBe(12);

    const accounts = listLaunchDemoAccounts();
    expect(accounts.find((a) => a.role === "buyer")?.demoUserKey).toBe("live-buyer");
    expect(accounts.find((a) => a.role === "seller")?.demoUserKey).toBe("live-seller");
  });

  it("defines all required demo order states and parcel labels", () => {
    expect(FULL_DEMO_ORDER_STATES).toHaveLength(14);
    expect(FULL_DEMO_ORDER_STATES).toContain("Label Created");
    expect(FULL_DEMO_ORDER_STATUS_SPECS).toHaveLength(14);
    expect(FULL_DEMO_PARCEL_SPECS.map((spec) => spec.label)).toContain("Parcel 1 of 1");
    expect(FULL_DEMO_PARCEL_SPECS.map((spec) => spec.label)).toContain("Parcel 3 of 3");
  });

  it("covers every Full Demo certification surface", () => {
    expect(FULL_DEMO_CERTIFICATION_SURFACES).toContain("Homepage");
    expect(FULL_DEMO_CERTIFICATION_SURFACES).toContain("Checkout");
    expect(FULL_DEMO_CERTIFICATION_SURFACES).toContain("Wallet");
    expect(FULL_DEMO_CERTIFICATION_SURFACES).toContain("Inbox Hub");
    expect(FULL_DEMO_CERTIFICATION_SURFACES).toContain("Business Dashboard");
    expect(FULL_DEMO_CERTIFICATION_SURFACES).toContain("Trust Centre");
    expect(FULL_DEMO_CERTIFICATION_SURFACES).toContain("Business Verification");
    expect(FULL_DEMO_CERTIFICATION_SURFACES.length).toBeGreaterThanOrEqual(20);
  });

  it("wires virtual payments, wallet, and demo shipping into real paths", () => {
    const checkout = readSource("lib/orders/checkout.ts");
    const payouts = readSource("lib/stripe/payouts.ts");
    const settlement = readSource("lib/commerce-engine/settlement.ts");
    const router = readSource("lib/shipping/providers/router.ts");

    expect(checkout).toContain("mustUseVirtualPayments");
    expect(checkout).toContain("debitVirtualBuyerWallet");
    expect(payouts).toContain("mustUseVirtualWallet");
    expect(settlement).toContain("mustUseVirtualWallet");
    expect(router).toContain("demoShippingAdapter");
  });

  it("protects Full Demo Accounts from deletion and cleanup", () => {
    expect(() => assertFullDemoNotDeletable("demo.buyer@rovexo.co.uk")).toThrow(
      FullDemoPermanenceError,
    );
    expect(readSource("lib/account/delete-account.ts")).toContain("assertFullDemoNotDeletable");
    expect(readSource("scripts/marketplace-reset.ts")).toContain("isFullDemoProtectedSlug");
    expect(readSource("scripts/closed-beta-cleanup.mjs")).toContain("isFullDemoEmail");
    expect(readSource("lib/homepage/demo-cleanup.ts")).toContain("isFullDemoProtectedSlug");
    expect(() =>
      assertFullDemoActionAllowed("demo.seller@rovexo.co.uk", "suspend"),
    ).toThrow(FullDemoPermanenceError);
    expect(() =>
      assertFullDemoActionAllowed("demo.seller@rovexo.co.uk", "reset_password"),
    ).toThrow(FullDemoPermanenceError);
    expect(() =>
      assertFullDemoActionAllowed("demo.seller@rovexo.co.uk", "restore"),
    ).not.toThrow();
    expect(readSource("lib/super-admin/users.ts")).toContain("assertFullDemoActionAllowed");
    expect(readSource("lib/staff-profile/service.ts")).toContain("assertFullDemoActionAllowed");
    expect(readSource("e2e/helpers/full-demo-safety.ts")).toContain("assertE2eUserDeletable");
    expect(readSource("lib/enterprise-deployment-center/actions.ts")).toContain(
      "assertFullDemoCertificationPassed",
    );
    expect(readSource("app/api/super-admin/deployment/deploy/route.ts")).toContain(
      "mfaVerified !== true",
    );
  });

  it("passes Full Demo Certification gate and allows live deployment only when green", () => {
    const report = runFullDemoCertificationScan();
    expect(report.passed).toBe(true);
    expect(report.deploymentBlocked).toBe(false);
    expect(isFullDemoCertificationPassed(report)).toBe(true);
    expect(isLiveDeploymentAllowed()).toBe(true);
    expect(report.checks.every((c) => c.pass)).toBe(true);
  });

  it("blocks real Stripe/Sendcloud when virtual flags are active", () => {
    const previousPrivate = process.env.ROVEXO_LAUNCH_PRIVATE_MODE;
    process.env.ROVEXO_LAUNCH_PRIVATE_MODE = "1";
    delete process.env.ROVEXO_VIRTUAL_PAYMENTS;
    delete process.env.ROVEXO_VIRTUAL_WALLET;
    delete process.env.SENDCLOUD_SANDBOX;

    expect(mustUseVirtualPayments()).toBe(true);
    expect(mustUseVirtualWallet()).toBe(true);
    expect(mustUseDemoShipping()).toBe(true);
    expect(resolveFullDemoSecuritySnapshot().realStripeBlocked).toBe(true);

    process.env.ROVEXO_LAUNCH_PRIVATE_MODE = previousPrivate;
  });

  it("protects demo actor emails", () => {
    expect(isFullDemoEmail("demo.buyer@rovexo.co.uk")).toBe(true);
    expect(isFullDemoEmail("demo.seller@rovexo.co.uk")).toBe(true);
    expect(isFullDemoEmail("user@example.com")).toBe(false);
  });

  it("aggregates the Final Deployment Certification Contract fail-closed", () => {
    const report = runDeploymentCertificationScan();
    const actualPassCount = report.checks.filter((entry) => entry.pass).length;
    const actualPercent = Math.round((actualPassCount / report.checks.length) * 100);
    expect(report.passCount).toBe(actualPassCount);
    expect(report.totalCount).toBe(report.checks.length);
    expect(report.passPercent).toBe(actualPercent);
    expect(report.passed).toBe(
      report.checks.length > 0 &&
        report.checks.every((entry) => entry.pass) &&
        actualPercent === 100,
    );
    expect(report.deploymentBlocked).toBe(!report.passed);
    expect(isDeploymentCertificationPassed(report)).toBe(report.passed);
    const ids = report.checks.map((c) => c.id);
    for (const gate of [
      "ui_audit",
      "ux_audit",
      "nine_blockers",
      "universal_ui_v1_1",
      "responsive",
      "performance",
      "authentication",
      "orders",
      "checkout",
      "wallet",
      "tracking",
      "notifications",
      "messages",
      "reviews",
      "homepage_freeze",
      "splash_welcome_removed",
      "startup_flow",
      "full_demo",
      "mandatory_e2e",
      "buyer_flow",
      "seller_flow",
      "playwright",
      "typescript",
      "eslint",
      "production_build",
      "predeploy_gate_wired",
      "database",
      "migrations",
      "protected_contracts",
      "deploy_action_gate",
      "no_manual_override",
      "official_launch_approved",
    ]) {
      expect(ids).toContain(gate);
    }
    expect(readSource("package.json")).toContain('"certify:deployment"');
    expect(readSource("vercel.json")).toMatch(/"buildCommand"\s*:\s*"npm run certify:predeploy"/);
    expect(readSource("package.json")).toContain("install-playwright-chromium.mjs");
    expect(readSource("package.json")).toContain("@sparticuz/chromium");
    expect(readSource("lib/enterprise-deployment-center/actions.ts")).toContain(
      "assertDeploymentCertificationPassed",
    );
    expect(readSource("lib/enterprise-deployment-center/actions.ts")).toContain(
      "assertReleaseProtectionNoOverride",
    );
    expect(readSource("app/api/super-admin/deployment/deploy/route.ts")).toContain(".strict()");
  });

  it("forbids Super Admin / CI / env overrides and non-100% scores", () => {
    expect(() => assertNoDeploymentOverridePayload({ forceDeploy: true })).toThrow(
      ReleaseOverrideForbiddenError,
    );
    expect(() => assertNoDeploymentOverridePayload({ skipTests: false })).toThrow(
      ReleaseOverrideForbiddenError,
    );
    expect(() =>
      assertNoDeploymentOverrideEnv({ ROVEXO_FORCE_DEPLOY: "1" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(ReleaseOverrideForbiddenError);
    expect(() => assertReleaseProtectionNoOverride({ payload: { bypass: true } })).toThrow(
      /Manual override forbidden/,
    );
    expect(isExactHundredPercentPass(99, true)).toBe(false);
    expect(isExactHundredPercentPass(99.999, true)).toBe(false);
    expect(isExactHundredPercentPass(100, false)).toBe(false);
    expect(isExactHundredPercentPass(100, true)).toBe(true);
  });

  it("blocks 99%, inconsistent reports, and any single failed gate", () => {
    const current = runDeploymentCertificationScan();
    const passed = {
      ...current,
      passed: true,
      deploymentBlocked: false,
      passCount: current.totalCount,
      passPercent: 100,
      checks: current.checks.map((entry) => ({ ...entry, pass: true })),
    };
    const failedChecks = passed.checks.map((entry, index) =>
      index === 0 ? { ...entry, pass: false } : entry,
    );
    const ninetyNine = {
      ...passed,
      passed: false,
      deploymentBlocked: true,
      passCount: passed.totalCount - 1,
      passPercent: 99,
      checks: failedChecks,
    };

    expect(isDeploymentCertificationPassed(ninetyNine)).toBe(false);
    expect(() => assertDeploymentCertificationPassed(ninetyNine)).toThrow(
      "Exactly 100% is required",
    );
    expect(
      isDeploymentCertificationPassed({
        ...passed,
        checks: failedChecks,
      }),
    ).toBe(false);
  });

  it("ships certify:full-demo CLI and exposes gate on launch certification API", () => {
    expect(readSource("package.json")).toContain('"certify:full-demo"');
    expect(readSource("scripts/certify-full-demo.ts")).toContain("assertFullDemoCertificationPassed");
    expect(readSource("package.json")).toContain('"certify:predeploy"');
    expect(readSource("package.json")).toContain('"certify:full-demo:live"');
    expect(readSource("e2e/full-demo-certification.spec.ts").match(/test\("\d{2} /g)).toHaveLength(
      25,
    );
    const api = readSource("app/api/super-admin/launch-certification/route.ts");
    expect(api).toContain("runFullDemoCertificationScan");
    expect(api).toContain("deploymentBlocked");
  });
});
