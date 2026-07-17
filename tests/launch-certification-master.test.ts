import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_DEMO_TEST_STEPS,
  BUYER_DEMO_TEST_STEPS,
  CERTIFICATION_CHECKLIST,
  FINAL_APPROVAL_GATES,
  FULL_TRANSACTION_TEST_STEPS,
  LAUNCH_CERTIFICATION_COPY,
  LAUNCH_CERTIFICATION_VERSION,
  NEGATIVE_TEST_SCENARIOS,
  PRODUCTION_BUG_POLICY,
  SELLER_DEMO_TEST_STEPS,
  SUPER_ADMIN_DEMO_TEST_STEPS,
} from "@/lib/launch-certification/canonical";
import {
  listLaunchDemoAccounts,
  resolveLaunchDemoAccount,
} from "@/lib/launch-certification/demo-accounts";
import {
  isLaunchCertificationPass,
  isOfficialLaunchApproved,
  resolveLaunchCertificationSummary,
} from "@/lib/launch-certification/gate";
import {
  isLaunchAdvertisingEnabled,
  isLaunchPrivateMode,
  resolveLaunchPrivateModeRobots,
} from "@/lib/launch-certification/private-mode";
import {
  getCertificationChecklistStatus,
  getFinalApprovalGateStatus,
  runLaunchCertificationScan,
} from "@/lib/launch-certification/scanner";

describe("LAUNCH_CERTIFICATION_MASTER_SPEC Document 1", () => {
  it("locks canonical version and deployment rule", () => {
    expect(LAUNCH_CERTIFICATION_VERSION).toBe("v1.1");
    expect(LAUNCH_CERTIFICATION_COPY.deploymentNotLaunch).toContain("Deployment");
    expect(LAUNCH_CERTIFICATION_COPY.deploymentNotLaunch).toContain("Launch");
  });

  it("defines buyer, seller, admin, and super admin demo flows", () => {
    expect(BUYER_DEMO_TEST_STEPS).toContain("buy_now");
    expect(BUYER_DEMO_TEST_STEPS).toContain("make_offer");
    expect(SELLER_DEMO_TEST_STEPS).toContain("generate_shipping_label");
    expect(ADMIN_DEMO_TEST_STEPS).toContain("moderation");
    expect(SUPER_ADMIN_DEMO_TEST_STEPS).toContain("platform_fee");
    expect(FULL_TRANSACTION_TEST_STEPS).toContain("company_platform_fee_verified");
    expect(NEGATIVE_TEST_SCENARIOS).toContain("duplicate_taps");
  });

  it("maps four production demo accounts without hidden shortcuts", () => {
    const accounts = listLaunchDemoAccounts();
    expect(accounts).toHaveLength(4);
    expect(accounts.map((account) => account.role)).toEqual([
      "buyer",
      "seller",
      "admin",
      "super_admin",
    ]);
    expect(resolveLaunchDemoAccount("buyer").email).toBe("demo.buyer@rovexo.co.uk");
    expect(resolveLaunchDemoAccount("seller").email).toBe("demo.seller@rovexo.co.uk");
    expect(resolveLaunchDemoAccount("buyer").label).toBe("ROVEXO LIVE BUYER");
    expect(resolveLaunchDemoAccount("seller").label).toBe("ROVEXO LIVE SELLER");
    expect(resolveLaunchDemoAccount("admin").email).toBe("admin@demo.rovexo.co.uk");
    expect(resolveLaunchDemoAccount("super_admin").email).toBe("superadmin@demo.rovexo.co.uk");
  });

  it("enforces production bug policy severity", () => {
    expect(PRODUCTION_BUG_POLICY.critical.launchBlocker).toBe(true);
    expect(PRODUCTION_BUG_POLICY.high.action).toBe("must_fix_before_launch");
    expect(PRODUCTION_BUG_POLICY.medium.action).toBe("review_before_launch");
    expect(PRODUCTION_BUG_POLICY.low.action).toBe("may_schedule_after_launch");
  });

  it("runs module certification scan across checklist", () => {
    const scan = runLaunchCertificationScan();
    expect(scan.totalCount).toBe(CERTIFICATION_CHECKLIST.length);
    expect(scan.modules).toHaveLength(CERTIFICATION_CHECKLIST.length);
    expect(scan.passPercent).toBe(100);
    expect(scan.allPassed).toBe(true);
    expect(scan.blockers).toHaveLength(0);

    const checklist = getCertificationChecklistStatus();
    expect(checklist).toHaveLength(CERTIFICATION_CHECKLIST.length);
    expect(checklist.every((entry) => entry.requiredStatus === "pass")).toBe(true);
    expect(checklist.every((entry) => entry.currentStatus === "pass")).toBe(true);
  });

  it("requires 100% pass and zero blockers for official launch approval", () => {
    const scan = runLaunchCertificationScan();
    const gates = getFinalApprovalGateStatus(scan);
    expect(gates).toHaveLength(FINAL_APPROVAL_GATES.length);
    expect(isOfficialLaunchApproved(scan)).toBe(isLaunchCertificationPass(scan) && gates.every((g) => g.pass));

    const summary = resolveLaunchCertificationSummary(scan);
    expect(summary.launchApproved).toBe(isOfficialLaunchApproved(scan));
    expect(summary.blockers).toEqual(scan.blockers);
  });

  it("supports private certification mode with global NOINDEX", () => {
    const previous = process.env.ROVEXO_LAUNCH_PRIVATE_MODE;
    process.env.ROVEXO_LAUNCH_PRIVATE_MODE = "1";
    expect(isLaunchPrivateMode()).toBe(true);
    expect(isLaunchAdvertisingEnabled()).toBe(false);
    expect(resolveLaunchPrivateModeRobots()).toEqual(
      expect.objectContaining({ index: false, follow: false }),
    );
    process.env.ROVEXO_LAUNCH_PRIVATE_MODE = previous;
  });
});

describe("launch certification production wiring", () => {
  it("wires private mode into robots and root layout", () => {
    const robotsSource = readFileSync(join(process.cwd(), "app/robots.ts"), "utf8");
    const layoutSource = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(robotsSource).toContain("isLaunchPrivateMode");
    expect(layoutSource).toContain("resolveLaunchPrivateModeRobots");
  });
});
