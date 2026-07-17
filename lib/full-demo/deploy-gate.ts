/**
 * Full Demo Certification — pre-deploy gate.
 * Live deployment MUST be blocked if any required gate fails.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  FULL_DEMO_ACCOUNTS,
  FULL_DEMO_BUYER_CERT_FLOW,
  FULL_DEMO_BUYER_QUOTAS,
  FULL_DEMO_CERTIFICATION_SURFACES,
  FULL_DEMO_MANDATORY_E2E_STEPS,
  FULL_DEMO_PERMANENCE_CONTRACT,
  FULL_DEMO_PRODUCT_TARGET,
  FULL_DEMO_RELEASE_REQUIREMENTS,
  FULL_DEMO_SELLER_CERT_FLOW,
  FULL_DEMO_SELLER_QUOTAS,
  FULL_DEMO_VERSION,
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
} from "@/lib/full-demo/canonical";
import { isFullDemoPermanenceLocked } from "@/lib/full-demo/permanence";
import { runCertificationDashboardScan } from "@/lib/launch-certification/dashboard-scanner";

export type FullDemoGateCheck = {
  id: string;
  pass: boolean;
  detail: string;
};

export type FullDemoCertificationReport = {
  version: string;
  generatedAt: string;
  passed: boolean;
  deploymentBlocked: boolean;
  checks: FullDemoGateCheck[];
  buyerFlow: readonly string[];
  sellerFlow: readonly string[];
  releaseRequirements: readonly string[];
  surfaces: readonly string[];
  quotas: {
    buyer: typeof FULL_DEMO_BUYER_QUOTAS;
    seller: typeof FULL_DEMO_SELLER_QUOTAS;
  };
};

function readSource(relativePath: string): string {
  const path = join(process.cwd(), relativePath);
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

function check(id: string, pass: boolean, detail: string): FullDemoGateCheck {
  return { id, pass, detail };
}

/** Static Full Demo Certification — wiring + contract presence. */
export function runFullDemoCertificationScan(): FullDemoCertificationReport {
  const checkout = readSource("lib/orders/checkout.ts");
  const payouts = readSource("lib/stripe/payouts.ts");
  const settlement = readSource("lib/commerce-engine/settlement.ts");
  const router = readSource("lib/shipping/providers/router.ts");
  const permanence = readSource("lib/full-demo/permanence.ts");
  const deleteAccount = readSource("lib/account/delete-account.ts");
  const seed = readSource("lib/demo-environment/full-demo-marketplace.ts");
  const marketplaceReset = readSource("scripts/marketplace-reset.ts");
  const closedBeta = readSource("scripts/closed-beta-cleanup.mjs");
  const packageJson = readSource("package.json");
  const mandatoryE2e = readSource("e2e/full-demo-certification.spec.ts");
  const superAdminUsers = readSource("lib/super-admin/users.ts");
  const deployActions = readSource("lib/enterprise-deployment-center/actions.ts");
  const deployRoute = readSource("app/api/super-admin/deployment/deploy/route.ts");
  const migrateWorkflow = readSource("scripts/supabase-migrate-workflow.mjs");
  const e2eSafety = readSource("e2e/helpers/full-demo-safety.ts");
  const staffService = readSource("lib/staff-profile/service.ts");

  const dashboard = runCertificationDashboardScan();

  const checks: FullDemoGateCheck[] = [
    check(
      "demo_accounts_permanent",
      FULL_DEMO_ACCOUNTS.length === 2 && isFullDemoPermanenceLocked(),
      "ROVEXO LIVE BUYER + LIVE SELLER permanence contract locked",
    ),
    check(
      "demo_virtual_funds",
      FULL_DEMO_VIRTUAL_FUNDS_GBP === 50_000 &&
        FULL_DEMO_BUYER_QUOTAS.virtualBalanceGbp === 50_000 &&
        FULL_DEMO_SELLER_QUOTAS.virtualBalanceGbp === 50_000,
      "Both accounts require £50,000 virtual balance",
    ),
    check(
      "demo_buyer_quotas",
      FULL_DEMO_BUYER_QUOTAS.completedOrders === 100 &&
        FULL_DEMO_BUYER_QUOTAS.cancelledOrders === 50 &&
        FULL_DEMO_BUYER_QUOTAS.refundedOrders === 50 &&
        FULL_DEMO_BUYER_QUOTAS.deliveredOrders === 50 &&
        FULL_DEMO_BUYER_QUOTAS.disputes === 50,
      "Buyer inventory quotas locked (100/50/50/50/50)",
    ),
    check(
      "demo_seller_quotas",
      FULL_DEMO_SELLER_QUOTAS.products === 100 &&
        FULL_DEMO_SELLER_QUOTAS.completedSales === 100 &&
        FULL_DEMO_SELLER_QUOTAS.counterOffers === 20 &&
        FULL_DEMO_SELLER_QUOTAS.promotions >= 10,
      "Seller inventory quotas locked (100 products + sales + offers + promotions)",
    ),
    check(
      "authentication_passed",
      existsSync(join(process.cwd(), "features/auth/components/LoginScreen.tsx")) &&
        existsSync(join(process.cwd(), "features/auth/components/RegisterScreen.tsx")),
      "Authentication screens present (Login + Register frozen)",
    ),
    check(
      "orders_passed",
      existsSync(join(process.cwd(), "lib/orders/checkout.ts")) &&
        seed.includes("FULLDEMO-"),
      "Orders path + Full Demo order seed present",
    ),
    check(
      "wallet_passed",
      payouts.includes("mustUseVirtualWallet") && settlement.includes("mustUseVirtualWallet"),
      "Virtual wallet / escrow payout path wired",
    ),
    check(
      "tracking_passed",
      router.includes("demoShippingAdapter") && seed.includes("shipping_tracking_events"),
      "Demo shipping + tracking history seed wired",
    ),
    check(
      "checkout_passed",
      checkout.includes("mustUseVirtualPayments") && checkout.includes("debitVirtualBuyerWallet"),
      "Virtual checkout path wired (no real Stripe in demo mode)",
    ),
    check(
      "responsive_passed",
      FULL_DEMO_CERTIFICATION_SURFACES.includes("Homepage" as never) &&
        FULL_DEMO_CERTIFICATION_SURFACES.length >= 20,
      "Certification surfaces include marketplace + responsive targets",
    ),
    check(
      "performance_passed",
      dashboard.passPercent === 100 && dashboard.allPassed,
      "Launch certification dashboard at 100%",
    ),
    check(
      "permanence_guards",
      permanence.includes("FullDemoPermanenceError") &&
        deleteAccount.includes("assertFullDemoNotDeletable") &&
        marketplaceReset.includes("isFullDemoProtectedSlug") &&
        closedBeta.includes("demo.buyer@rovexo.co.uk") &&
        superAdminUsers.includes("assertFullDemoActionAllowed") &&
        staffService.includes("assertFullDemoActionAllowed") &&
        e2eSafety.includes("assertE2eUserDeletable") &&
        migrateWorkflow.includes("full_demo_account_delete"),
      "Delete/suspend/reset/cleanup/migration/E2E paths refuse Full Demo Accounts",
    ),
    check(
      "deploy_action_gate",
      deployActions.includes("assertFullDemoCertificationPassed") &&
        deployActions.includes("validateDeploymentReadiness") &&
        deployRoute.includes("assertFullDemoCertificationPassed") &&
        deployRoute.includes("mfaVerified !== true") &&
        deployActions.includes("assertDeploymentCertificationPassed") &&
        deployActions.includes("assertReleaseProtectionNoOverride"),
      "Super Admin deploy API requires MFA + Full Demo + Deployment certification + no-override",
    ),
    check(
      "mandatory_e2e_wired",
      FULL_DEMO_MANDATORY_E2E_STEPS.length === 25 &&
        (mandatoryE2e.match(/test\("\d{2} /g)?.length ?? 0) === 25 &&
        packageJson.includes('"test:e2e:certification"') &&
        packageJson.includes('"certify:predeploy"') &&
        packageJson.includes('"certify:full-demo:live"'),
      "All 25 runtime E2E steps and fail-closed pre-deployment command are wired",
    ),
    check(
      "buyer_flow_defined",
      FULL_DEMO_BUYER_CERT_FLOW.length === 8 && FULL_DEMO_BUYER_CERT_FLOW[0] === "login",
      "Buyer cert flow: login → … → completed",
    ),
    check(
      "seller_flow_defined",
      FULL_DEMO_SELLER_CERT_FLOW.length === 8 && FULL_DEMO_SELLER_CERT_FLOW.includes("wallet_payout"),
      "Seller cert flow: login → … → wallet_payout → completed",
    ),
    check(
      "product_target",
      FULL_DEMO_PRODUCT_TARGET >= 100,
      "LIVE SELLER requires ≥100 products",
    ),
    check(
      "permanence_contract",
      FULL_DEMO_PERMANENCE_CONTRACT.neverDelete &&
        FULL_DEMO_PERMANENCE_CONTRACT.neverExpire &&
        FULL_DEMO_PERMANENCE_CONTRACT.neverDisable &&
        FULL_DEMO_PERMANENCE_CONTRACT.neverSuspend &&
        FULL_DEMO_PERMANENCE_CONTRACT.noRealMoneyRequired &&
        FULL_DEMO_PERMANENCE_CONTRACT.officialCertificationAccounts,
      "Permanence contract: never expire / delete / reset",
    ),
  ];

  const releaseMap: Record<string, boolean> = {
    demo_certification_passed: checks
      .filter((c) =>
        ["demo_accounts_permanent", "demo_buyer_quotas", "demo_seller_quotas", "permanence_guards", "mandatory_e2e_wired"].includes(
          c.id,
        ),
      )
      .every((c) => c.pass),
    authentication_passed: checks.find((c) => c.id === "authentication_passed")?.pass ?? false,
    orders_passed: checks.find((c) => c.id === "orders_passed")?.pass ?? false,
    wallet_passed: checks.find((c) => c.id === "wallet_passed")?.pass ?? false,
    tracking_passed: checks.find((c) => c.id === "tracking_passed")?.pass ?? false,
    checkout_passed: checks.find((c) => c.id === "checkout_passed")?.pass ?? false,
    responsive_passed: checks.find((c) => c.id === "responsive_passed")?.pass ?? false,
    performance_passed: checks.find((c) => c.id === "performance_passed")?.pass ?? false,
  };

  for (const requirement of FULL_DEMO_RELEASE_REQUIREMENTS) {
    checks.push(
      check(
        `release_${requirement}`,
        Boolean(releaseMap[requirement]),
        `Release requirement: ${requirement}`,
      ),
    );
  }

  const passed = checks.every((c) => c.pass);

  return {
    version: FULL_DEMO_VERSION,
    generatedAt: new Date().toISOString(),
    passed,
    deploymentBlocked: !passed,
    checks,
    buyerFlow: FULL_DEMO_BUYER_CERT_FLOW,
    sellerFlow: FULL_DEMO_SELLER_CERT_FLOW,
    releaseRequirements: FULL_DEMO_RELEASE_REQUIREMENTS,
    surfaces: FULL_DEMO_CERTIFICATION_SURFACES,
    quotas: {
      buyer: FULL_DEMO_BUYER_QUOTAS,
      seller: FULL_DEMO_SELLER_QUOTAS,
    },
  };
}

/** Hard stop for live deployment — throws when Full Demo Certification fails. */
export function assertFullDemoCertificationPassed(
  report: FullDemoCertificationReport = runFullDemoCertificationScan(),
): void {
  if (!report.passed) {
    const failures = report.checks.filter((c) => !c.pass).map((c) => `${c.id}: ${c.detail}`);
    throw new Error(
      `[FULL DEMO CERTIFICATION FAILED] Live deployment BLOCKED.\n${failures.join("\n")}`,
    );
  }
}

export function isFullDemoCertificationPassed(
  report: FullDemoCertificationReport = runFullDemoCertificationScan(),
): boolean {
  return report.passed;
}

export function isLiveDeploymentAllowed(): boolean {
  return isFullDemoCertificationPassed();
}
