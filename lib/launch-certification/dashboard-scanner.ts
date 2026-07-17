import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  CERTIFICATION_DASHBOARD_MODULES,
  CERTIFICATION_MODE_VERSION,
} from "@/lib/launch-certification/certification-mode-document2";
import type {
  CertificationDashboardModuleId,
  CertificationModuleResult,
  CertificationStatus,
} from "@/lib/launch-certification/types";

type DashboardProbe = {
  id: CertificationDashboardModuleId;
  label: string;
  requiredPaths: string[];
  requiredSnippets?: Array<{ id: string; path: string; contains: string }>;
};

const DASHBOARD_PROBES: DashboardProbe[] = [
  {
    id: "authentication",
    label: "Authentication",
    requiredPaths: ["lib/auth/session.ts", "lib/auth/rate-limit.ts", "lib/auth/actions.ts"],
    requiredSnippets: [
      { id: "registration-guard", path: "lib/auth/actions.ts", contains: "isPublicRegistrationEnabled" },
    ],
  },
  {
    id: "sell",
    label: "Sell",
    requiredPaths: ["features/sell/ui/SellScreen.tsx", "tests/sell-scroll-v1.test.ts"],
  },
  {
    id: "homepage",
    label: "Homepage",
    requiredPaths: ["lib/homepage/config.ts", "app/page.tsx"],
  },
  {
    id: "search",
    label: "Search",
    requiredPaths: ["features/search/components/SearchResultsView.tsx", "app/search/page.tsx"],
  },
  {
    id: "product",
    label: "Product",
    requiredPaths: [
      "features/product-detail/ProductDetailPage.tsx",
      "features/product-detail/ProductActionBarV1.tsx",
    ],
  },
  {
    id: "messages",
    label: "Messages",
    requiredPaths: ["features/messages/components/ChatPage.tsx", "app/messages/page.tsx"],
  },
  {
    id: "transaction_hub",
    label: "Transaction Hub",
    requiredPaths: [
      "lib/transaction-hub/canonical.ts",
      "features/transaction-hub/TransactionHubBottomActions.tsx",
    ],
  },
  {
    id: "checkout",
    label: "Checkout",
    requiredPaths: [
      "features/checkout/components/CheckoutWizardV1.tsx",
      "features/transaction-hub/CheckoutHubSheet.tsx",
      "lib/orders/checkout.ts",
      "lib/full-demo/virtual-checkout.ts",
    ],
    requiredSnippets: [
      { id: "virtual_payments", path: "lib/orders/checkout.ts", contains: "mustUseVirtualPayments" },
    ],
  },
  {
    id: "wallet",
    label: "Wallet",
    requiredPaths: ["features/wallet/components/WalletHubV1.tsx", "lib/transaction-hub/seller-wallet.ts"],
    requiredSnippets: [
      { id: "virtual_wallet", path: "lib/stripe/payouts.ts", contains: "mustUseVirtualWallet" },
    ],
  },
  {
    id: "shipping",
    label: "Shipping",
    requiredPaths: [
      "lib/shipping/sendcloud/service.ts",
      "lib/shipping/sendcloud/client.ts",
      "lib/shipping/pricing/demo-adapter.ts",
      "lib/launch-certification/certification-mode.ts",
    ],
    requiredSnippets: [
      { id: "sandbox", path: "lib/launch-certification/certification-mode.ts", contains: "isSendcloudSandboxMode" },
      { id: "demo_adapter", path: "lib/shipping/providers/router.ts", contains: "demoShippingAdapter" },
    ],
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
    id: "admin",
    label: "Admin",
    requiredPaths: ["app/admin/layout.tsx"],
  },
  {
    id: "super_admin",
    label: "Super Admin",
    requiredPaths: [
      "app/super-admin/layout.tsx",
      "app/super-admin/launch-certification/page.tsx",
      "features/super-admin/launch-certification/CertificationDashboard.tsx",
    ],
  },
  {
    id: "performance",
    label: "Performance",
    requiredPaths: ["playwright.config.ts", "styles/rovexo/mobile-scroll-v1.css"],
  },
  {
    id: "security",
    label: "Security",
    requiredPaths: ["lib/auth/session.ts", "tests/prelaunch-audit.test.ts"],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    requiredPaths: ["tests/image-safety-canonical.test.ts"],
  },
  {
    id: "seo",
    label: "SEO",
    requiredPaths: ["app/robots.ts", "lib/seo/metadata.ts"],
    requiredSnippets: [{ id: "private-mode", path: "app/robots.ts", contains: "isLaunchPrivateMode" }],
  },
];

function readProjectFile(relativePath: string): string | null {
  const absolute = path.join(process.cwd(), relativePath);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, "utf8");
}

function probeDashboardModule(module: DashboardProbe): CertificationModuleResult {
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

  const status: CertificationStatus = checks.every((check) => check.pass) ? "pass" : "fail";

  return {
    id: module.id,
    label: module.label,
    status,
    checks,
  };
}

export type CertificationDashboardScanResult = {
  version: string;
  scannedAt: string;
  modules: CertificationModuleResult[];
  passCount: number;
  totalCount: number;
  passPercent: number;
  allPassed: boolean;
  blockers: string[];
};

export function runCertificationDashboardScan(): CertificationDashboardScanResult {
  const modules = DASHBOARD_PROBES.map(probeDashboardModule);
  const passCount = modules.filter((module) => module.status === "pass").length;
  const totalCount = modules.length;
  const passPercent = totalCount === 0 ? 0 : Math.round((passCount / totalCount) * 100);
  const allPassed = passCount === totalCount;
  const blockers = modules
    .filter((module) => module.status !== "pass")
    .map((module) => `${module.label} certification failed`);

  return {
    version: CERTIFICATION_MODE_VERSION,
    scannedAt: new Date().toISOString(),
    modules,
    passCount,
    totalCount,
    passPercent,
    allPassed,
    blockers,
  };
}

export function getCertificationDashboardStatus() {
  const scan = runCertificationDashboardScan();
  return CERTIFICATION_DASHBOARD_MODULES.map((entry) => ({
    id: entry.id,
    label: entry.label,
    status: scan.modules.find((module) => module.id === entry.id)?.status ?? "pending",
  }));
}
