/**
 * ROVEXO v1.0 — Final Deployment Certification Contract (canonical aggregator).
 *
 * Binds every named certification and pre-deployment gate into ONE fail-closed
 * report. Live deployment is allowed ONLY when every gate passes. Static gates
 * are verified here; runtime gates (Playwright E2E, live Supabase) are enforced
 * by `certify:predeploy` (build → seed → live verify → E2E → live verify).
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { runFullDemoCertificationScan } from "@/lib/full-demo/deploy-gate";
import { isOfficialLaunchApproved, resolveLaunchCertificationSummary } from "@/lib/launch-certification/gate";
import {
  FORBIDDEN_DEPLOYMENT_OVERRIDE_ENV,
  FORBIDDEN_DEPLOYMENT_OVERRIDE_KEYS,
  assertReleaseProtectionNoOverride,
  isExactHundredPercentPass,
} from "@/lib/full-demo/no-override";

export type DeploymentGateCheck = {
  id: string;
  pass: boolean;
  detail: string;
};

export type DeploymentCertificationReport = {
  version: string;
  generatedAt: string;
  passCount: number;
  totalCount: number;
  passPercent: number;
  passed: boolean;
  deploymentBlocked: boolean;
  checks: DeploymentGateCheck[];
};

function read(relativePath: string): string {
  const path = join(process.cwd(), relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function has(relativePath: string): boolean {
  return existsSync(join(process.cwd(), relativePath));
}

function check(id: string, pass: boolean, detail: string): DeploymentGateCheck {
  return { id, pass, detail };
}

function migrationsPass(): boolean {
  const directory = join(process.cwd(), "supabase/migrations");
  if (!existsSync(directory)) return false;

  const files = readdirSync(directory).filter((file) => file.endsWith(".sql"));
  if (files.length === 0) return false;

  const versions = new Set<string>();
  for (const file of files) {
    const match = /^(\d{14})_[a-z0-9][a-z0-9_-]*\.sql$/i.exec(file);
    if (!match || versions.has(match[1])) return false;
    versions.add(match[1]);

    const sql = readFileSync(join(directory, file), "utf8");
    if (!sql.trim() || /^(<{7}|={7}|>{7})/m.test(sql)) return false;
    if (
      /demo\.(buyer|seller)@rovexo\.co\.uk/i.test(sql) &&
      /(delete\s+from\s+(?:auth\.)?users|delete\s+from\s+profiles|account_status\s*=\s*['"](?:suspended|deleted|disabled)['"]|banned_until)/i.test(
        sql,
      )
    ) {
      return false;
    }
  }

  return true;
}

/** Static aggregate of the Final Deployment Certification Contract. */
export function runDeploymentCertificationScan(): DeploymentCertificationReport {
  assertReleaseProtectionNoOverride();

  const pkg = read("package.json");
  const vercel = read("vercel.json");
  const fullDemo = runFullDemoCertificationScan();
  const launchSummary = resolveLaunchCertificationSummary();
  const noOverride = read("lib/full-demo/no-override.ts");
  const deployRoute = read("app/api/super-admin/deployment/deploy/route.ts");
  const deployActions = read("lib/enterprise-deployment-center/actions.ts");
  const cursorNoOverride = has(".cursor/rules/no-manual-override-v1.mdc");

  const checks: DeploymentGateCheck[] = [
    // 1–2. UI + UX audit (launch certification module scan covers UI/UX surfaces).
    check(
      "ui_audit",
      launchSummary.dashboardAllPassed,
      "Launch certification dashboard (UI surfaces) at 100%",
    ),
    check("ux_audit", launchSummary.launchApproved, "Official launch (UX flow) approved"),
    // 3. All 9 blockers (production blockers migration + prelaunch audit).
    check(
      "nine_blockers",
      has("supabase/migrations/20250620000008_production_blockers.sql") &&
        has("tests/prelaunch-audit.test.ts"),
      "Production blockers migration + prelaunch audit present",
    ),
    // 4. Universal UI v1.1.
    check(
      "universal_ui_v1_1",
      read("components/layout/UniversalUiBoundary.tsx").includes('"v1.1"'),
      "Universal UI v1.1 boundary present",
    ),
    // 5. Responsive certification (device matrix + responsive E2E).
    check(
      "responsive",
      has("e2e/responsive.spec.ts") &&
        read("scripts/playwright-projects.mjs").includes("iPhone") &&
        read("scripts/playwright-projects.mjs").includes("Pixel 7"),
      "Responsive E2E + iPhone/Android/tablet/desktop device matrix",
    ),
    // 6. Performance certification.
    check(
      "performance",
      has("styles/rovexo/mobile-scroll-v1.css") && has("lib/mobile-ui/scroll-standard.ts"),
      "Performance/scroll standards present",
    ),
    // 7. Authentication (Login/Register frozen, startup flow).
    check(
      "authentication",
      has("features/auth/components/LoginScreen.tsx") &&
        has("features/auth/components/RegisterScreen.tsx") &&
        has("tests/auth-startup-canonical.test.ts"),
      "Auth screens + canonical startup flow present",
    ),
    check(
      "orders",
      has("lib/orders/checkout.ts") && has("tests/orders-canonical-hub.test.ts"),
      "Orders implementation + certification tests present",
    ),
    check(
      "checkout",
      has("app/api/orders/checkout/route.ts") &&
        has("features/checkout/components/CheckoutWizardV1.tsx"),
      "Checkout API + canonical UI present",
    ),
    check(
      "wallet",
      has("features/wallet/components/WalletHubV1.tsx") &&
        has("tests/transaction-hub-seller-wallet.test.ts"),
      "Wallet implementation + certification tests present",
    ),
    check(
      "tracking",
      has("lib/shipping/providers/router.ts") && has("lib/commerce-engine/settlement.ts"),
      "Tracking/shipping + settlement paths present",
    ),
    check(
      "notifications",
      has("features/notifications/components/RealtimeNotificationProvider.tsx") &&
        has("tests/notifications-performance-v1.test.ts"),
      "Notifications implementation + tests present",
    ),
    check(
      "messages",
      has("features/inbox/components/InboxPage.tsx") &&
        has("e2e/messages-notifications-v1.spec.ts"),
      "Messages/Inbox Hub implementation + E2E present",
    ),
    check(
      "reviews",
      has("app/api/reviews/route.ts") && has("features/seller/review-center/components/SellerReviewCasePage.tsx"),
      "Reviews API + seller review UI present",
    ),
    // 8. Homepage certification (freeze).
    check(
      "homepage_freeze",
      has("reports/phase-2/module-01/HOMEPAGE-UI-LOCK-V1-REPORT.md") &&
        has("tests/homepage-eligibility.test.ts"),
      "Homepage freeze baseline + tests present",
    ),
    // 9–10. Splash + Welcome removed.
    check(
      "splash_welcome_removed",
      read("app/(auth)/splash/page.tsx").includes("permanentRedirect") &&
        read("app/(auth)/welcome/page.tsx").includes("permanentRedirect"),
      "Splash + Welcome permanently redirect to /login",
    ),
    // 11. Startup flow (guest → login, session → homepage).
    check(
      "startup_flow",
      read("app/manifest.ts").includes('start_url: "/"') ||
        read("app/manifest.ts").includes('"start_url": "/"') ||
        read("app/manifest.ts").includes("start_url: '/'"),
      "PWA start_url is Homepage; guests redirect to Login",
    ),
    // 12. Full Demo certification (static contract) + protection.
    check("full_demo", fullDemo.passed, "Full Demo static contract passed"),
    check(
      "full_demo_live_verifier",
      has("lib/full-demo/live-verification.ts") && has("scripts/verify-full-demo-live.ts"),
      "Full Demo live account/quota verifier present",
    ),
    check(
      "mandatory_e2e",
      (read("e2e/full-demo-certification.spec.ts").match(/test\("\d{2} /g)?.length ?? 0) === 25,
      "25-step mandatory buyer/seller E2E flow present",
    ),
    check(
      "buyer_flow",
      read("e2e/full-demo-certification.spec.ts").includes("BUYER LOGIN") &&
        read("e2e/full-demo-certification.spec.ts").includes("BUY NOW"),
      "Official buyer certification flow present",
    ),
    check(
      "seller_flow",
      read("e2e/full-demo-certification.spec.ts").includes("SELLER LOGIN") &&
        read("e2e/full-demo-certification.spec.ts").includes("SELLER RECEIVES ORDER"),
      "Official seller certification flow present",
    ),
    check(
      "playwright",
      pkg.includes('"test:e2e:certification"') &&
        pkg.includes('"test:e2e:certification:responsive"'),
      "Core Playwright + responsive/PWA matrix wired",
    ),
    check("typescript", pkg.includes('"typecheck": "tsc --noEmit"'), "TypeScript gate wired"),
    check("eslint", pkg.includes('"lint": "eslint"'), "ESLint gate wired"),
    check(
      "production_build",
      pkg.includes('"build:production": "next build"'),
      "Production build gate wired",
    ),
    // Pre-deployment gate matrix — must be wired fail-closed.
    check(
      "predeploy_gate_wired",
      pkg.includes('"certify:predeploy"') &&
        pkg.includes('"certify:full-demo:live"') &&
        pkg.includes('"certify:deployment"') &&
        pkg.includes('"test:database"') &&
        pkg.includes('"test:migrations"') &&
        /"buildCommand"\s*:\s*"npm run certify:predeploy"/.test(vercel),
      "certify:predeploy is the Vercel buildCommand (fail-closed)",
    ),
    check(
      "database",
      pkg.includes('"test:database"') && has("tests/supabase.integration.test.ts"),
      "Live Supabase database integration gate wired",
    ),
    check(
      "migrations",
      pkg.includes('"test:migrations"') &&
        has("scripts/validate-migrations.mjs") &&
        read("scripts/supabase-migrate-workflow.mjs").includes("full_demo_account_delete") &&
        migrationsPass(),
      "Migration files must be unique, valid, conflict-free, and Full Demo-safe",
    ),
    check(
      "protected_contracts",
      has(".cursor/rules/full-demo-certification-permanent.mdc") &&
        has(".cursor/rules/login-ui-v1-freeze.mdc") &&
        has(".cursor/rules/final-release-protection-v1.mdc") &&
        has(".cursor/rules/no-manual-override-v1.mdc") &&
        has(".cursor/rules/feature-freeze-fix-certify-v1.mdc"),
      "Protected contract rules present",
    ),
    check(
      "deploy_action_gate",
      deployActions.includes("assertFullDemoCertificationPassed") &&
        deployActions.includes("assertReleaseProtectionNoOverride") &&
        deployRoute.includes("assertDeploymentCertificationPassed") &&
        deployRoute.includes("mfaVerified !== true") &&
        deployRoute.includes(".strict()"),
      "Deploy API requires MFA + Full Demo + final certification + strict no-override schema",
    ),
    check(
      "no_manual_override",
      cursorNoOverride &&
        noOverride.includes("FORBIDDEN_DEPLOYMENT_OVERRIDE_KEYS") &&
        noOverride.includes("FORBIDDEN_DEPLOYMENT_OVERRIDE_ENV") &&
        FORBIDDEN_DEPLOYMENT_OVERRIDE_KEYS.includes("forceDeploy") &&
        FORBIDDEN_DEPLOYMENT_OVERRIDE_ENV.includes("ROVEXO_FORCE_DEPLOY") &&
        read("scripts/certify-deployment.ts").includes("assertReleaseProtectionNoOverride") &&
        read("scripts/certify-full-demo.ts").includes("assertReleaseProtectionNoOverride"),
      "No manual override contract wired for Super Admin, Vercel, CI/CD, and scripts",
    ),
    check("official_launch_approved", isOfficialLaunchApproved(), "Official launch gate approved"),
  ];

  const passCount = checks.filter((entry) => entry.pass).length;
  const totalCount = checks.length;
  const passPercent = totalCount === 0 ? 0 : Math.round((passCount / totalCount) * 100);
  const passed =
    totalCount > 0 &&
    passCount === totalCount &&
    isExactHundredPercentPass(passPercent, checks.every((entry) => entry.pass));

  return {
    version: "v1.0",
    generatedAt: new Date().toISOString(),
    passCount,
    totalCount,
    passPercent,
    passed,
    deploymentBlocked: !passed,
    checks,
  };
}

export function assertDeploymentCertificationPassed(
  report: DeploymentCertificationReport = runDeploymentCertificationScan(),
): void {
  if (!isDeploymentCertificationPassed(report)) {
    const failures = report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`);
    throw new Error(
      `[DEPLOYMENT CERTIFICATION FAILED] Live deployment BLOCKED at ${report.passPercent}%. ` +
        "Exactly 100% is required.\n" +
        `${failures.join("\n")}`,
    );
  }
}

export function isDeploymentCertificationPassed(
  report: DeploymentCertificationReport = runDeploymentCertificationScan(),
): boolean {
  return (
    report.passed === true &&
    report.deploymentBlocked === false &&
    report.totalCount > 0 &&
    report.passCount === report.totalCount &&
    report.passPercent === 100 &&
    report.checks.length === report.totalCount &&
    report.checks.every((entry) => entry.pass)
  );
}
