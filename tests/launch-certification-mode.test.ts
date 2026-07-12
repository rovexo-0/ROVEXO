import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICATION_DASHBOARD_MODULES,
  CERTIFICATION_EMAIL_TEMPLATES,
  CERTIFICATION_LAUNCH_CONDITIONS,
  CERTIFICATION_MODE_COPY,
  CERTIFICATION_MODE_VERSION,
  CERTIFICATION_ORDER_FLOW_STEPS,
  CERTIFICATION_RETURN_FLOW_STEPS,
  DEMO_PAYMENT_STATUSES,
  DEMO_WALLET_STATES,
  OFFICIAL_LAUNCH_SETTINGS,
} from "@/lib/launch-certification/certification-mode-document2";
import {
  isCertificationMode,
  isSendcloudSandboxMode,
  resolveCertificationModeConfig,
} from "@/lib/launch-certification/certification-mode";
import { isVirtualPaymentMode } from "@/lib/launch-certification/demo-payments";
import { isVirtualWalletMode } from "@/lib/launch-certification/demo-wallet";
import {
  isGuestBrowsingEnabled,
  isGoogleIndexingEnabled,
  isPublicRegistrationEnabled,
} from "@/lib/launch-certification/private-mode";
import { runCertificationDashboardScan } from "@/lib/launch-certification/dashboard-scanner";
import { isCertificationDashboardPass } from "@/lib/launch-certification/gate";

describe("LAUNCH_CERTIFICATION_MASTER_SPEC Document 2", () => {
  it("locks certification mode version and global rules", () => {
    expect(CERTIFICATION_MODE_VERSION).toBe("v1.1");
    expect(CERTIFICATION_MODE_COPY.noRealMoney).toContain("No real money");
    expect(CERTIFICATION_MODE_COPY.mandatory).toContain("100%");
  });

  it("defines dashboard modules, flows, and launch conditions", () => {
    expect(CERTIFICATION_DASHBOARD_MODULES).toHaveLength(17);
    expect(CERTIFICATION_DASHBOARD_MODULES.map((m) => m.id)).toContain("transaction_hub");
    expect(CERTIFICATION_ORDER_FLOW_STEPS).toContain("virtual_payment");
    expect(CERTIFICATION_RETURN_FLOW_STEPS).toContain("refund");
    expect(DEMO_PAYMENT_STATUSES).toEqual([
      "success",
      "failed",
      "pending",
      "refunded",
      "cancelled",
    ]);
    expect(DEMO_WALLET_STATES).toContain("withdraw_requested");
    expect(CERTIFICATION_EMAIL_TEMPLATES).toContain("verify_email");
    expect(CERTIFICATION_LAUNCH_CONDITIONS).toContain("zero_payment_bugs");
    expect(OFFICIAL_LAUNCH_SETTINGS.privateModeEnv).toBe("ROVEXO_LAUNCH_PRIVATE_MODE=0");
  });

  it("enables virtual payments and wallet in certification mode", () => {
    const previous = process.env.ROVEXO_LAUNCH_PRIVATE_MODE;
    process.env.ROVEXO_LAUNCH_PRIVATE_MODE = "1";
    expect(isCertificationMode()).toBe(true);
    expect(isVirtualPaymentMode()).toBe(true);
    expect(isVirtualWalletMode()).toBe(true);
    expect(isSendcloudSandboxMode()).toBe(true);
    expect(isPublicRegistrationEnabled()).toBe(false);
    expect(isGoogleIndexingEnabled()).toBe(false);
    expect(isGuestBrowsingEnabled()).toBe(true);
    expect(resolveCertificationModeConfig().virtualPayments).toBe(true);
    process.env.ROVEXO_LAUNCH_PRIVATE_MODE = previous;
  });

  it("runs certification dashboard scan at 100%", () => {
    const scan = runCertificationDashboardScan();
    expect(scan.totalCount).toBe(17);
    expect(scan.passPercent).toBe(100);
    expect(scan.allPassed).toBe(true);
    expect(isCertificationDashboardPass()).toBe(true);
  });

  it("blocks public registration during certification", () => {
    const registerPage = readFileSync(
      join(process.cwd(), "app/(auth)/register/page.tsx"),
      "utf8",
    );
    const signUp = readFileSync(join(process.cwd(), "lib/auth/actions.ts"), "utf8");
    expect(registerPage).toContain("isPublicRegistrationEnabled");
    expect(signUp).toContain("isPublicRegistrationEnabled");
  });

  it("ships super-admin certification dashboard", () => {
    const page = readFileSync(
      join(process.cwd(), "app/super-admin/launch-certification/page.tsx"),
      "utf8",
    );
    const api = readFileSync(
      join(process.cwd(), "app/api/super-admin/launch-certification/route.ts"),
      "utf8",
    );
    expect(page).toContain("CertificationDashboard");
    expect(api).toContain("runCertificationDashboardScan");
  });
});
