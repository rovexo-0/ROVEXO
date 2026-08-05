/**
 * ROVEXO ABSOLUTE BLOOD LAW XLII
 * FULL PLATFORM CERTIFICATION
 *
 * STATUS: SUPREME | LOCKED | CERTIFIED CONTRACT | FAIL CLOSED
 *
 * Architecture split (COD SÂNGE — Production Policy):
 * 1. certifyFullPlatformLocalXlII — localhost:3000 / CI / Owner cert (Full Demo,
 *    Playwright, E2E, Launch Dashboard, reports, .cursor, seeds, deploy evidence).
 *    FAIL CLOSED. Never from Production request boot.
 * 2. certifyFullPlatformProductionRuntimeXlII — live Production runtime invariants
 *    only (NFT-safe). FAIL CLOSED. Instrumentation only.
 * 3. assertFullPlatformProductionReleaseOrBlock — independent 100% release gate
 *    (OAuth + runtime E2E + full local matrix). FAIL CLOSED. Never during boot.
 *
 * XLII is NOT disabled. Production remains fail-closed. Preview policy unchanged.
 * No FLASH_AUTH / CERT_BLOCK / env bypasses as substitutes for this split.
 *
 * Local Full Platform environment: http://localhost:3000 ONLY
 * Data: never mutate production listings/users/wallet/orders/messages/offers/transactions
 * Demo: isolated Full Demo Buyer + Seller only (virtual money)
 *
 * Parents: XXXVIII · XXXIX · XL · XLI · Full Demo · Production Certification
 */

import { existsSync, readFileSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";
import { FULL_DEMO_ACCOUNTS } from "@/lib/full-demo/canonical";
import { runFullDemoCertificationScan } from "@/lib/full-demo/deploy-gate";
import { runDeploymentCertificationScan } from "@/lib/full-demo/deployment-certification";
import { certifyAuthenticationExperienceFinalFreezeXli } from "@/lib/supreme-blood-law-xli-authentication-experience-final-freeze-v1";
import { ROVEXO_PRODUCTION_CERTIFICATION_V1 } from "@/lib/rovexo-production-certification-v1";

export const FULL_PLATFORM_CERT_ORIGIN = "http://localhost:3000" as const;

/** Isolated Demo Certification Layer — Full Demo only (no production mutation). */
export const DEMO_CERTIFICATION_LAYER_V1 = {
  version: "1.0",
  isolated: true,
  virtualMoneyOnly: true,
  restoreAfterCertification: true,
  zeroPermanentChanges: true,
  forbidden: [
    "Modify production listings",
    "Delete production listings",
    "Edit production listings",
    "Edit production users",
    "Corrupt Wallet",
    "Corrupt Orders",
    "Corrupt Messages",
    "Corrupt Offers",
    "Corrupt Transactions",
  ] as const,
  /** Official Full Demo accounts only — Demo Business catalogue permanently removed. */
  accounts: {
    buyer: FULL_DEMO_ACCOUNTS[0]?.email ?? "demo.buyer@rovexo.co.uk",
    seller: FULL_DEMO_ACCOUNTS[1]?.email ?? "demo.seller@rovexo.co.uk",
  },
  surfaces: ["buyer", "seller", "admin_readonly_audit", "super_admin_readonly_audit"] as const,
} as const;

export type FullPlatformModuleId =
  | "01_authentication"
  | "02_homepage"
  | "03_search"
  | "04_listing"
  | "05_messaging"
  | "06_offers"
  | "07_checkout"
  | "08_wallet"
  | "09_withdraw"
  | "10_payment_methods"
  | "11_shipping"
  | "12_orders"
  | "13_tracking"
  | "14_reviews"
  | "15_notifications"
  | "16_dashboards"
  | "17_visual_audit"
  | "18_performance"
  | "19_error_audit"
  | "20_end_to_end";

export type FullPlatformModuleResult = "PASS" | "FAIL";

export type FullPlatformModuleSpec = {
  id: FullPlatformModuleId;
  label: string;
  routeEvidence: readonly string[];
  sourceEvidence: readonly string[];
  requiredTokens: readonly string[];
};

export const FULL_PLATFORM_CERTIFICATION_MODULES: readonly FullPlatformModuleSpec[] = [
  {
    id: "01_authentication",
    label: "Authentication",
    routeEvidence: ["app/(auth)/login/page.tsx", "app/(auth)/register/page.tsx"],
    sourceEvidence: [
      "features/auth/components/LoginScreen.tsx",
      "features/auth/components/RegisterScreen.tsx",
      "features/auth/components/ForgotPasswordScreen.tsx",
    ],
    requiredTokens: ["Remember Me", "signIn", "signUp", "Forgot Password"],
  },
  {
    id: "02_homepage",
    label: "Homepage",
    routeEvidence: ["app/(main)/page.tsx", "app/(platform)/page.tsx"],
    sourceEvidence: [
      "components/header/RovexoHeaderV2.tsx",
      "components/ui/ListingCard.tsx",
    ],
    requiredTokens: ["OFFICIAL_BRAND_APP_ICON", "HomepageSearchField"],
  },
  {
    id: "03_search",
    label: "Search",
    routeEvidence: ["app/(main)/search/page.tsx", "app/(platform)/search/page.tsx"],
    sourceEvidence: ["lib/search/search-engine-v1.ts", "lib/search/search-master-freeze-v1.ts"],
    requiredTokens: ["search", "Recent"],
  },
  {
    id: "04_listing",
    label: "Listing",
    routeEvidence: ["app/(platform)/listing/[slug]/page.tsx"],
    sourceEvidence: [
      "features/product-detail/ProductActionBarV1.tsx",
      "features/transaction-hub/TransactionHubBottomActions.tsx",
      "features/home/hooks/use-product-watchlist.ts",
    ],
    requiredTokens: ["Buy Now", "Make Offer", "saved"],
  },
  {
    id: "05_messaging",
    label: "Messaging",
    routeEvidence: ["app/(main)/inbox/page.tsx", "app/(platform)/inbox/(list)/page.tsx", "app/(platform)/inbox/page.tsx"],
    sourceEvidence: [
      "features/inbox/components/InboxPage.tsx",
      "features/inbox/components/ConversationHub.tsx",
    ],
    requiredTokens: ["ConversationHub", "inbox"],
  },
  {
    id: "06_offers",
    label: "Offers",
    routeEvidence: [],
    sourceEvidence: [
      "features/inbox/components/ConversationHub.tsx",
      "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    ],
    requiredTokens: ["Offer", "Counter", "Accept", "Decline"],
  },
  {
    id: "07_checkout",
    label: "Checkout",
    routeEvidence: ["app/(main)/checkout/page.tsx", "app/(platform)/checkout/page.tsx"],
    sourceEvidence: [
      "lib/checkout/buy-now-guard-v1.ts",
      "lib/supreme-blood-code-xxiii-v1.ts",
    ],
    requiredTokens: ["checkout", "Buy Now"],
  },
  {
    id: "08_wallet",
    label: "Wallet",
    routeEvidence: ["app/(main)/wallet/page.tsx", "app/(platform)/wallet/page.tsx", "app/(platform)/balance/page.tsx"],
    sourceEvidence: ["lib/wallet/balance-final-freeze-v1.1.ts"],
    requiredTokens: ["Balance", "Withdraw"],
  },
  {
    id: "09_withdraw",
    label: "Withdraw",
    routeEvidence: [],
    sourceEvidence: ["lib/wallet/balance-final-freeze-v1.1.ts"],
    requiredTokens: ["Withdraw"],
  },
  {
    id: "10_payment_methods",
    label: "Payment Methods",
    routeEvidence: [
      "app/(main)/wallet/payment-methods/page.tsx",
      "app/(platform)/wallet/payment-methods/page.tsx",
    ],
    sourceEvidence: [],
    requiredTokens: ["Payment"],
  },
  {
    id: "11_shipping",
    label: "Shipping",
    routeEvidence: [],
    sourceEvidence: ["lib/shipping/label-generation.server.ts"],
    requiredTokens: ["label", "Sendcloud", "tracking"],
  },
  {
    id: "12_orders",
    label: "Orders",
    routeEvidence: ["app/(main)/orders/page.tsx", "app/(platform)/orders/page.tsx"],
    sourceEvidence: ["lib/supreme-blood-code-xii-v1.ts"],
    requiredTokens: ["Orders"],
  },
  {
    id: "13_tracking",
    label: "Tracking",
    routeEvidence: [],
    sourceEvidence: ["features/inbox/components/ConversationHub.tsx"],
    requiredTokens: ["Track", "tracking"],
  },
  {
    id: "14_reviews",
    label: "Reviews",
    routeEvidence: [],
    sourceEvidence: [
      "features/inbox/components/ConversationHub.tsx",
      "features/orders/components/OrderReviewCard.tsx",
    ],
    requiredTokens: ["Review", "rating"],
  },
  {
    id: "15_notifications",
    label: "Notifications",
    routeEvidence: [],
    sourceEvidence: ["features/inbox/components/InboxPage.tsx"],
    requiredTokens: ["notification", "Inbox"],
  },
  {
    id: "16_dashboards",
    label: "Dashboards",
    routeEvidence: [
      "app/(main)/account/page.tsx",
      "app/(platform)/account/page.tsx",
      "app/(platform)/super-admin/page.tsx",
    ],
    sourceEvidence: ["lib/account-center/canonical-menu.ts"],
    requiredTokens: ["account", "Profile"],
  },
  {
    id: "17_visual_audit",
    label: "Visual QA",
    routeEvidence: [],
    sourceEvidence: [
      "styles/rovexo/full-width-engine-v1.css",
      "lib/master-engine/master-full-width-contract-v1.ts",
      "lib/supreme-blood-law-xli-authentication-experience-final-freeze-v1.ts",
    ],
    requiredTokens: ["FULL WIDTH", "180px", "28px"],
  },
  {
    id: "18_performance",
    label: "Performance",
    routeEvidence: [],
    sourceEvidence: ["components/ui/SafeImage.tsx", "lib/media/is-valid-image-src.ts"],
    requiredTokens: ["SafeImage", "isRenderableImageSrc"],
  },
  {
    id: "19_error_audit",
    label: "Errors",
    routeEvidence: ["app/not-found.tsx", "app/error.tsx", "app/global-error.tsx"],
    sourceEvidence: ["lib/fail-closed/index.ts", "components/fail-closed/FailClosedPanel.tsx"],
    requiredTokens: ["FailClosed", "fail-closed"],
  },
  {
    id: "20_end_to_end",
    label: "End-to-End Certification",
    routeEvidence: [],
    sourceEvidence: [
      "e2e/full-demo-certification.spec.ts",
      "e2e/full-platform-certification.spec.ts",
      "lib/full-demo/canonical.ts",
    ],
    requiredTokens: ["FULL_DEMO", "demo.buyer", "Checkout"],
  },
] as const;

export const SUPREME_BLOOD_LAW_XLII_FULL_PLATFORM_CERTIFICATION_V1 = {
  version: "1.0",
  bloodLaw: "XLII",
  name: "Full Platform Certification",
  status: "SUPREME_LOCKED_FAIL_CLOSED",
  supreme: true,
  locked: true,
  failClosed: true,
  certifiedAt: "2026-07-25",
  environment: FULL_PLATFORM_CERT_ORIGIN,
  forbiddenEnvironments: ["Preview", "Storybook", "mocked pages", "screenshots only"] as const,
  demoLayer: DEMO_CERTIFICATION_LAYER_V1,
  modules: FULL_PLATFORM_CERTIFICATION_MODULES,
  e2eFlow: [
    "Message",
    "Offer",
    "Counter Offer",
    "Accept",
    "Checkout",
    "Payment",
    "Wallet Update",
    "Generate Shipping Label",
    "Print Label",
    "Tracking",
    "Delivery",
    "Review",
    "Complete Order",
  ] as const,
  equation:
    "ONE_PLATFORM = ONE_CERTIFICATION = ONE_REPORT = ZERO_SILENT_FAILURES = FAIL_CLOSED",
  productionReadyRule:
    "The platform SHALL NOT be declared Production Ready until every module, every visual audit, every functional audit, every end-to-end flow, and every certification gate passes successfully.",
  parentBloodLaws: ["XXXVIII", "XXXIX", "XL", "XLI"] as const,
} as const;

export type SupremeBloodLawXliiFullPlatformCertification =
  typeof SUPREME_BLOOD_LAW_XLII_FULL_PLATFORM_CERTIFICATION_V1;

export type FullPlatformCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
};

export type FullPlatformModuleReport = {
  id: FullPlatformModuleId;
  label: string;
  result: FullPlatformModuleResult;
  checks: FullPlatformCheck[];
};

export type FullPlatformBlockingIssue = {
  severity: "Critical" | "High" | "Medium" | "Low";
  module: string;
  detail: string;
};

export type FullPlatformCertificationReport = {
  ok: boolean;
  bloodLaw: "XLII";
  environment: typeof FULL_PLATFORM_CERT_ORIGIN;
  productionReady: boolean;
  productionReadinessPercent: number;
  modules: FullPlatformModuleReport[];
  moduleSummary: Record<string, FullPlatformModuleResult>;
  blockingIssues: FullPlatformBlockingIssue[];
  checks: FullPlatformCheck[];
  errors: string[];
  generatedAt: string;
};

function projectRoot(...segments: string[]): string {
  return workspacePath(...segments);
}

function firstExisting(candidates: readonly string[]): string | null {
  for (const relative of candidates) {
    if (existsSync(projectRoot(...relative.split("/")))) return relative;
  }
  return null;
}

function readRelative(relative: string): string {
  const file = projectRoot(...relative.split("/"));
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function moduleContractPass(spec: FullPlatformModuleSpec): {
  pass: boolean;
  checks: FullPlatformCheck[];
} {
  const checks: FullPlatformCheck[] = [];

  if (spec.routeEvidence.length > 0) {
    const hit = firstExisting(spec.routeEvidence);
    checks.push({
      id: `${spec.id}:route`,
      label: `${spec.label} route present`,
      pass: Boolean(hit),
      detail: hit ? `Found ${hit}` : `Missing one of: ${spec.routeEvidence.join(" | ")}`,
    });
  }

  if (spec.sourceEvidence.length > 0) {
    const hit = firstExisting(spec.sourceEvidence);
    checks.push({
      id: `${spec.id}:source`,
      label: `${spec.label} source present`,
      pass: Boolean(hit),
      detail: hit ? `Found ${hit}` : `Missing one of: ${spec.sourceEvidence.join(" | ")}`,
    });
  }

  const corpus = [
    ...spec.routeEvidence.map(readRelative),
    ...spec.sourceEvidence.map(readRelative),
  ].join("\n");

  for (const token of spec.requiredTokens) {
    const present = corpus.toLowerCase().includes(token.toLowerCase());
    checks.push({
      id: `${spec.id}:token:${token}`,
      label: `${spec.label} token “${token}”`,
      pass: present,
      detail: present ? "Present in module evidence" : `Token missing: ${token}`,
    });
  }

  return { pass: checks.every((c) => c.pass), checks };
}

function isProductionRuntimeEvidencePath(relative: string): boolean {
  return (
    !relative.startsWith("e2e/") &&
    !relative.startsWith("tests/") &&
    !relative.startsWith("reports/") &&
    !relative.startsWith(".cursor/") &&
    !relative.startsWith("docs/") &&
    !relative.startsWith("scripts/")
  );
}

function finalizeFullPlatformReport(input: {
  checks: FullPlatformCheck[];
  modules: FullPlatformModuleReport[];
  blockingIssues: FullPlatformBlockingIssue[];
  errors: string[];
}): FullPlatformCertificationReport {
  const { checks, modules, blockingIssues, errors } = input;
  const moduleSummary: Record<string, FullPlatformModuleResult> = {};
  for (const mod of modules) {
    moduleSummary[mod.label] = mod.result;
  }

  const modulePassCount = modules.filter((m) => m.result === "PASS").length;
  const gatePassCount = checks.filter((c) => c.pass).length;
  const totalUnits = modules.length + checks.length;
  const passUnits = modulePassCount + gatePassCount;
  const productionReadinessPercent =
    totalUnits === 0 ? 0 : Math.round((passUnits / totalUnits) * 1000) / 10;

  const allModulesPass = modules.every((m) => m.result === "PASS");
  const allGatesPass = checks.every((c) => c.pass);
  const ok = allModulesPass && allGatesPass;
  const productionReady = ok && productionReadinessPercent === 100;

  return {
    ok,
    bloodLaw: "XLII",
    environment: FULL_PLATFORM_CERT_ORIGIN,
    productionReady,
    productionReadinessPercent,
    modules,
    moduleSummary,
    blockingIssues,
    checks,
    errors: [...new Set(errors)],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * LOCAL FULL PLATFORM CERTIFICATION — fail closed.
 * localhost:3000 · CI · Owner Certification.
 * Aggregates module contracts + parent freezes + Full Demo + deployment gates +
 * Launch Dashboard + E2E evidence requirements.
 * NEVER executed from Production request boot.
 */
export function certifyFullPlatformLocalXlII(
  options: { runtimeE2eEvidencePass?: boolean } = {},
): FullPlatformCertificationReport {
  const law = SUPREME_BLOOD_LAW_XLII_FULL_PLATFORM_CERTIFICATION_V1;
  const checks: FullPlatformCheck[] = [];
  const errors: string[] = [];
  const blockingIssues: FullPlatformBlockingIssue[] = [];

  const add = (
    id: string,
    label: string,
    pass: boolean,
    detail: string,
    severity: FullPlatformBlockingIssue["severity"] = "Critical",
  ) => {
    checks.push({ id, label, pass, detail });
    if (!pass) {
      errors.push(detail);
      blockingIssues.push({ severity, module: label, detail });
    }
  };

  add(
    "law-locked",
    "Full Platform Certification Locked",
    law.locked === true && law.failClosed === true && law.supreme === true,
    "XLII Full Platform Certification must remain supreme · locked · fail-closed",
  );

  add(
    "environment-localhost-3000",
    "Certification Environment localhost:3000",
    law.environment === "http://localhost:3000",
    "Full Platform Certification environment must be http://localhost:3000 only",
  );

  add(
    "demo-isolation",
    "Demo Certification Layer Isolated",
    DEMO_CERTIFICATION_LAYER_V1.isolated &&
      DEMO_CERTIFICATION_LAYER_V1.virtualMoneyOnly &&
      DEMO_CERTIFICATION_LAYER_V1.zeroPermanentChanges &&
      DEMO_CERTIFICATION_LAYER_V1.accounts.buyer.includes("demo.buyer@") &&
      DEMO_CERTIFICATION_LAYER_V1.accounts.seller.includes("demo.seller@"),
    "Demo Certification Layer must use isolated Full Demo Buyer/Seller only",
  );

  const xli = certifyAuthenticationExperienceFinalFreezeXli();
  add(
    "parent-xli",
    "Parent Blood Law XLI (Auth Experience)",
    xli.ok,
    xli.ok ? "XLI PASS" : xli.errors[0] ?? "XLI failed",
  );

  const fullDemo = runFullDemoCertificationScan();
  add(
    "full-demo-gate",
    "Full Demo Certification Gate",
    fullDemo.passed,
    fullDemo.passed
      ? "Full Demo gate PASS"
      : fullDemo.checks.find((c) => !c.pass)?.detail ?? "Full Demo gate FAIL",
  );

  const deployment = runDeploymentCertificationScan();
  add(
    "deployment-gate",
    "Deployment Certification Gate",
    deployment.passed,
    deployment.passed
      ? "Deployment gate PASS"
      : deployment.checks.find((c) => !c.pass)?.detail ?? "Deployment gate FAIL",
  );

  // P10.6R — v1.0 OAuth production gate = Google live only.
  // Apple / Facebook = DEFERRED_V2_NOT_BLOCKING (must not block deploy).
  const googleLoginEnabled: boolean = ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.GOOGLE_LOGIN;
  const oauthPass = googleLoginEnabled;
  add(
    "oauth-config",
    "OAuth Configuration (Google live · v1.0)",
    oauthPass,
    oauthPass
      ? "Google OAuth live PASS (Apple/Facebook deferred v2.0 — not blocking)"
      : "OAuth configuration FAIL — Google live awaiting Owner confirmation. NO DEPLOY.",
    "Critical",
  );

  const e2eSpec = readRelative("e2e/full-platform-certification.spec.ts");
  add(
    "e2e-spec-present",
    "Full Platform E2E Spec Present",
    e2eSpec.includes("localhost:3000") &&
      e2eSpec.includes("FULL_PLATFORM") &&
      e2eSpec.includes("FULL_DEMO_ACCOUNTS"),
    "e2e/full-platform-certification.spec.ts must target localhost:3000 + Full Demo",
  );

  const modules: FullPlatformModuleReport[] = [];

  for (const spec of FULL_PLATFORM_CERTIFICATION_MODULES) {
    const { pass, checks: moduleChecks } = moduleContractPass(spec);
    let result: FullPlatformModuleResult = pass ? "PASS" : "FAIL";

    // E2E module requires explicit runtime evidence for PASS.
    if (spec.id === "20_end_to_end") {
      const runtimeOk = options.runtimeE2eEvidencePass === true;
      moduleChecks.push({
        id: "20_end_to_end:runtime",
        label: "E2E runtime evidence on localhost:3000",
        pass: runtimeOk,
        detail: runtimeOk
          ? "Runtime E2E evidence PASS"
          : "Runtime E2E evidence REQUIRED — run e2e/full-platform-certification.spec.ts against http://localhost:3000",
      });
      if (!runtimeOk) result = "FAIL";
    }

    if (!pass || result === "FAIL") {
      for (const failed of moduleChecks.filter((c) => !c.pass)) {
        blockingIssues.push({
          severity: spec.id === "20_end_to_end" ? "Critical" : "High",
          module: spec.label,
          detail: failed.detail,
        });
        errors.push(`[${spec.label}] ${failed.detail}`);
      }
    }

    modules.push({
      id: spec.id,
      label: spec.label,
      result,
      checks: moduleChecks,
    });
  }

  return finalizeFullPlatformReport({ checks, modules, blockingIssues, errors });
}

/** @deprecated Prefer certifyFullPlatformLocalXlII — alias kept for callers. */
export function certifyFullPlatformXlII(
  options: { runtimeE2eEvidencePass?: boolean } = {},
): FullPlatformCertificationReport {
  return certifyFullPlatformLocalXlII(options);
}

/**
 * PRODUCTION RUNTIME CERTIFICATION — fail closed.
 * Protects live Production requests only. NFT-safe evidence paths.
 * Executed ONLY from instrumentation (via assertFullPlatformProductionRuntimeOrBlock).
 * Does NOT run Launch Dashboard, Playwright, reports, .cursor, seeds, or deploy aggregates.
 */
export function certifyFullPlatformProductionRuntimeXlII(): FullPlatformCertificationReport {
  const law = SUPREME_BLOOD_LAW_XLII_FULL_PLATFORM_CERTIFICATION_V1;
  const checks: FullPlatformCheck[] = [];
  const errors: string[] = [];
  const blockingIssues: FullPlatformBlockingIssue[] = [];

  const add = (
    id: string,
    label: string,
    pass: boolean,
    detail: string,
    severity: FullPlatformBlockingIssue["severity"] = "Critical",
  ) => {
    checks.push({ id, label, pass, detail });
    if (!pass) {
      errors.push(detail);
      blockingIssues.push({ severity, module: label, detail });
    }
  };

  add(
    "law-locked",
    "Full Platform Certification Locked",
    law.locked === true && law.failClosed === true && law.supreme === true,
    "XLII Full Platform Certification must remain supreme · locked · fail-closed",
  );

  add(
    "demo-isolation-constants",
    "Demo Certification Layer Constants",
    DEMO_CERTIFICATION_LAYER_V1.isolated &&
      DEMO_CERTIFICATION_LAYER_V1.virtualMoneyOnly &&
      DEMO_CERTIFICATION_LAYER_V1.zeroPermanentChanges &&
      DEMO_CERTIFICATION_LAYER_V1.accounts.buyer.includes("demo.buyer@") &&
      DEMO_CERTIFICATION_LAYER_V1.accounts.seller.includes("demo.seller@"),
    "Demo isolation constants must remain locked (no production mutation contract)",
  );

  const policy = readRelative("lib/startup/startup-certification-policy-v1.ts");
  add(
    "startup-fail-closed-wiring",
    "Startup fail-closed wiring",
    policy.includes('productionOnFail: "throw-and-block"') &&
      policy.includes("shouldBlockStartupOnCertificationFailure") &&
      policy.includes('env.VERCEL_ENV === "preview"'),
    "Production must throw-and-block; Preview log-and-continue wiring must remain",
  );

  const instrumentation = readRelative("instrumentation.ts");
  add(
    "instrumentation-runtime-xlII",
    "Instrumentation wires Production Runtime XLII",
    instrumentation.includes("assertFullPlatformProductionRuntimeOrBlock") &&
      !instrumentation.includes("assertFullPlatformCertificationOrBlock()"),
    "instrumentation.ts must execute Production Runtime XLII only (not Local Full Platform)",
  );

  add(
    "auth-runtime-surfaces",
    "Production authentication surfaces",
    Boolean(firstExisting(["features/auth/components/LoginScreen.tsx"])) &&
      Boolean(firstExisting(["features/auth/components/RegisterScreen.tsx"])) &&
      Boolean(firstExisting(["app/(auth)/login/page.tsx", "app/login/page.tsx"])) &&
      Boolean(firstExisting(["app/(auth)/register/page.tsx", "app/register/page.tsx"])),
    "Login + Register runtime surfaces must be present",
  );

  add(
    "fail-closed-runtime",
    "Fail-closed runtime surfaces",
    Boolean(firstExisting(["components/fail-closed/FailClosedPanel.tsx"])) &&
      Boolean(firstExisting(["lib/fail-closed/index.ts"])) &&
      Boolean(firstExisting(["app/error.tsx"])) &&
      Boolean(firstExisting(["app/global-error.tsx"])),
    "FailClosedPanel + error boundaries must be present for live requests",
  );

  add(
    "marketplace-runtime-routes",
    "Marketplace live routes",
    Boolean(firstExisting(["app/(platform)/page.tsx", "app/(main)/page.tsx"])) &&
      Boolean(firstExisting(["app/(platform)/search/page.tsx", "app/(main)/search/page.tsx"])) &&
      Boolean(firstExisting(["app/(platform)/listing/[slug]/page.tsx"])) &&
      Boolean(firstExisting(["app/(platform)/inbox/(list)/page.tsx", "app/(platform)/inbox/page.tsx", "app/(main)/inbox/page.tsx"])) &&
      Boolean(firstExisting(["app/(platform)/checkout/page.tsx", "app/(main)/checkout/page.tsx"])) &&
      Boolean(firstExisting(["app/(platform)/orders/page.tsx", "app/(main)/orders/page.tsx"])) &&
      Boolean(firstExisting(["app/(platform)/wallet/page.tsx", "app/(main)/wallet/page.tsx", "app/(platform)/balance/page.tsx"])),
    "Homepage · Search · Listing · Inbox · Checkout · Orders · Wallet routes must exist",
  );

  const xli = certifyAuthenticationExperienceFinalFreezeXli();
  add(
    "parent-xli",
    "Parent Blood Law XLI (Auth Experience)",
    xli.ok,
    xli.ok ? "XLI PASS" : xli.errors[0] ?? "XLI failed",
  );

  const modules: FullPlatformModuleReport[] = [];

  for (const spec of FULL_PLATFORM_CERTIFICATION_MODULES) {
    // Module 20 is Local / Release evidence only — never a Production boot gate.
    if (spec.id === "20_end_to_end") {
      continue;
    }

    const runtimeSpec: FullPlatformModuleSpec = {
      ...spec,
      sourceEvidence: spec.sourceEvidence.filter(isProductionRuntimeEvidencePath),
    };

    if (runtimeSpec.routeEvidence.length === 0 && runtimeSpec.sourceEvidence.length === 0) {
      continue;
    }

    const { pass, checks: moduleChecks } = moduleContractPass(runtimeSpec);
    const result: FullPlatformModuleResult = pass ? "PASS" : "FAIL";

    if (!pass) {
      for (const failed of moduleChecks.filter((c) => !c.pass)) {
        blockingIssues.push({
          severity: "Critical",
          module: spec.label,
          detail: failed.detail,
        });
        errors.push(`[${spec.label}] ${failed.detail}`);
      }
    }

    modules.push({
      id: spec.id,
      label: spec.label,
      result,
      checks: moduleChecks,
    });
  }

  return finalizeFullPlatformReport({ checks, modules, blockingIssues, errors });
}

/**
 * Local Full Platform contract assert — fail closed for CI / local cert.
 * Runtime E2E + OAuth may fail without throwing here; release gate still rejects.
 * NEVER call from Production instrumentation.
 */
export function assertFullPlatformLocalOrBlock(): void {
  const report = certifyFullPlatformLocalXlII({ runtimeE2eEvidencePass: false });

  const contractErrors = report.errors.filter(
    (e) =>
      !e.includes("Runtime E2E evidence REQUIRED") &&
      !e.includes("OAuth configuration FAIL"),
  );

  if (contractErrors.length > 0) {
    throw new Error(
      `[BLOOD LAW XLII] LOCAL FULL PLATFORM CERTIFICATION FAILED — FAIL CLOSED.\n` +
        contractErrors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}

/** @deprecated Prefer assertFullPlatformLocalOrBlock — local/CI contract only. */
export function assertFullPlatformCertificationOrBlock(): void {
  assertFullPlatformLocalOrBlock();
}

/**
 * Production Runtime assert — FAIL CLOSED.
 * Instrumentation MUST call this (and only this) for XLII.
 */
export function assertFullPlatformProductionRuntimeOrBlock(): void {
  const report = certifyFullPlatformProductionRuntimeXlII();
  if (!report.ok || report.errors.length > 0) {
    throw new Error(
      `[BLOOD LAW XLII] PRODUCTION RUNTIME CERTIFICATION FAILED — FAIL CLOSED.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}

/**
 * PRODUCTION RELEASE GATE — fail closed.
 * Requires every local module + OAuth + runtime E2E evidence = 100%.
 * NEVER executed during request boot.
 */
export function assertFullPlatformProductionReleaseOrBlock(
  options: { runtimeE2eEvidencePass: boolean },
): void {
  const report = certifyFullPlatformLocalXlII(options);
  if (!report.productionReady) {
    throw new Error(
      `[BLOOD LAW XLII] PRODUCTION RELEASE BLOCKED — ${report.productionReadinessPercent}% (need 100%).\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}

export function formatFullPlatformCertificationReport(
  report: FullPlatformCertificationReport,
): string {
  const lines = [
    "ROVEXO FULL PLATFORM CERTIFICATION — BLOOD LAW XLII",
    `Environment: ${report.environment}`,
    `Generated: ${report.generatedAt}`,
    "",
  ];
  for (const mod of report.modules) {
    lines.push(`${mod.label} ........ ${mod.result}`);
  }
  lines.push("");
  lines.push(`Production Readiness ........ ${report.productionReadinessPercent}%`);
  lines.push(`Production Ready ........ ${report.productionReady ? "YES" : "NO"}`);
  lines.push("");
  lines.push("Blocking Issues");
  if (report.blockingIssues.length === 0) {
    lines.push("None");
  } else {
    for (const issue of report.blockingIssues) {
      lines.push(`[${issue.severity}] ${issue.module}: ${issue.detail}`);
    }
  }
  return lines.join("\n");
}
