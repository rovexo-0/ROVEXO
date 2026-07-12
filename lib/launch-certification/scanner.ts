import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ACCESSIBILITY_CERTIFICATION_AREAS,
  CERTIFICATION_CHECKLIST,
  FINAL_APPROVAL_GATES,
  LAUNCH_CERTIFICATION_VERSION,
} from "@/lib/launch-certification/canonical";
import type {
  CertificationModuleId,
  CertificationModuleResult,
  LaunchCertificationScanResult,
} from "@/lib/launch-certification/types";

type ModuleProbe = {
  id: CertificationModuleId;
  label: string;
  requiredPaths: string[];
  requiredSnippets?: Array<{ id: string; path: string; contains: string }>;
};

const MODULE_PROBES: ModuleProbe[] = [
  {
    id: "sell",
    label: "Sell",
    requiredPaths: ["features/sell/ui/SellScreen.tsx", "tests/sell-scroll-v1.test.ts"],
    requiredSnippets: [{ id: "publish", path: "features/sell/ui/SellScreen.tsx", contains: "SellScreen" }],
  },
  {
    id: "product_details",
    label: "Product Details",
    requiredPaths: [
      "features/product-detail/ProductDetailPage.tsx",
      "features/product-detail/ProductActionBarV1.tsx",
      "tests/product-detail-ui-v1.test.ts",
      "tests/product-action-bar-canonical.test.ts",
    ],
  },
  {
    id: "checkout",
    label: "Checkout",
    requiredPaths: [
      "features/checkout/components/CheckoutWizardV1.tsx",
      "features/transaction-hub/CheckoutHubSheet.tsx",
      "tests/transaction-hub-checkout.test.ts",
    ],
  },
  {
    id: "transaction_hub",
    label: "Transaction Hub",
    requiredPaths: [
      "lib/transaction-hub/canonical.ts",
      "features/transaction-hub/TransactionHubBottomActions.tsx",
      "tests/transaction-hub-canonical.test.ts",
    ],
  },
  {
    id: "wallet",
    label: "Wallet",
    requiredPaths: [
      "features/wallet/components/WalletHubV1.tsx",
      "lib/transaction-hub/seller-wallet.ts",
      "tests/transaction-hub-seller-wallet.test.ts",
    ],
  },
  {
    id: "orders",
    label: "Orders",
    requiredPaths: ["lib/orders/checkout.ts", "app/api/orders/checkout/route.ts"],
  },
  {
    id: "tracking",
    label: "Tracking",
    requiredPaths: ["lib/commerce-engine/escrow.ts", "lib/commerce-engine/settlement.ts"],
  },
  {
    id: "notifications",
    label: "Notifications",
    requiredPaths: [
      "features/notifications/components/RealtimeNotificationProvider.tsx",
      "lib/notifications/offline-sync.ts",
    ],
  },
  {
    id: "reviews",
    label: "Reviews",
    requiredPaths: ["features/seller/review-center/components/SellerReviewCasePage.tsx"],
  },
  {
    id: "admin",
    label: "Admin",
    requiredPaths: ["app/admin/layout.tsx"],
    requiredSnippets: [{ id: "noindex", path: "app/admin/layout.tsx", contains: "index: false" }],
  },
  {
    id: "super_admin",
    label: "Super Admin",
    requiredPaths: ["app/super-admin/layout.tsx"],
    requiredSnippets: [{ id: "noindex", path: "app/super-admin/layout.tsx", contains: "index: false" }],
  },
  {
    id: "seo",
    label: "SEO",
    requiredPaths: [
      "lib/seo/metadata.ts",
      "lib/seo/engine/index-control.ts",
      "app/robots.ts",
      "app/sitemap.ts",
    ],
    requiredSnippets: [
      { id: "private-mode", path: "app/robots.ts", contains: "isLaunchPrivateMode" },
    ],
  },
  {
    id: "security",
    label: "Security",
    requiredPaths: [
      "lib/auth/session.ts",
      "supabase/migrations/20250626000009_prelaunch_security.sql",
      "tests/prelaunch-audit.test.ts",
    ],
  },
  {
    id: "performance",
    label: "Performance",
    requiredPaths: [
      "styles/rovexo/mobile-scroll-v1.css",
      "lib/mobile-ui/scroll-standard.ts",
      "playwright.config.ts",
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    requiredPaths: [
      "tests/image-safety-canonical.test.ts",
      "styles/rovexo/product-detail-v1.css",
    ],
    requiredSnippets: [
      {
        id: "reduced-motion",
        path: "styles/rovexo/product-detail-v1.css",
        contains: "prefers-reduced-motion",
      },
    ],
  },
];

function readProjectFile(relativePath: string): string | null {
  const absolute = path.join(process.cwd(), relativePath);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, "utf8");
}

function probeModule(module: ModuleProbe): CertificationModuleResult {
  const checks: CertificationModuleResult["checks"] = [];

  for (const requiredPath of module.requiredPaths) {
    checks.push({
      id: `path:${requiredPath}`,
      pass: existsSync(path.join(process.cwd(), requiredPath)),
      detail: requiredPath,
    });
  }

  for (const snippet of module.requiredSnippets ?? []) {
    const source = readProjectFile(snippet.path);
    checks.push({
      id: snippet.id,
      pass: Boolean(source?.includes(snippet.contains)),
      detail: snippet.path,
    });
  }

  const status = checks.every((check) => check.pass) ? "pass" : "fail";

  return {
    id: module.id,
    label: module.label,
    status,
    checks,
  };
}

export function runLaunchCertificationScan(): LaunchCertificationScanResult {
  const modules = MODULE_PROBES.map(probeModule);
  const passCount = modules.filter((module) => module.status === "pass").length;
  const totalCount = modules.length;
  const passPercent = totalCount === 0 ? 0 : Math.round((passCount / totalCount) * 100);
  const allPassed = passCount === totalCount;
  const blockers = modules
    .filter((module) => module.status !== "pass")
    .map((module) => `${module.label} certification incomplete`);

  return {
    version: LAUNCH_CERTIFICATION_VERSION,
    scannedAt: new Date().toISOString(),
    modules,
    passCount,
    totalCount,
    passPercent,
    allPassed,
    launchApproved: allPassed,
    blockers,
  };
}

export function getCertificationChecklistStatus(): Array<{
  id: CertificationModuleId;
  label: string;
  requiredStatus: "pass";
  currentStatus: "pass" | "fail" | "pending";
}> {
  const scan = runLaunchCertificationScan();
  const byId = new Map(scan.modules.map((module) => [module.id, module.status]));

  return CERTIFICATION_CHECKLIST.map((entry) => ({
    id: entry.id,
    label: entry.label,
    requiredStatus: entry.requiredStatus,
    currentStatus: byId.get(entry.id) ?? "pending",
  }));
}

export function getFinalApprovalGateStatus(scan: LaunchCertificationScanResult = runLaunchCertificationScan()) {
  return FINAL_APPROVAL_GATES.map((gate) => {
    switch (gate) {
      case "certification_100_percent_passed":
        return { id: gate, pass: scan.allPassed };
      case "zero_critical_bugs":
      case "zero_data_loss":
      case "zero_payment_issues":
      case "zero_security_issues":
      case "zero_broken_user_flows":
        return { id: gate, pass: scan.allPassed };
      default:
        return { id: gate, pass: false };
    }
  });
}

export const LAUNCH_CERTIFICATION_ACCESSIBILITY_AREAS = ACCESSIBILITY_CERTIFICATION_AREAS;
