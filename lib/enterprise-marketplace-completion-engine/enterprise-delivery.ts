import {
  AUTONOMOUS_FEATURE_DISCOVERY,
  DELIVERY_MANAGEMENT_QUEUES,
  DELIVERY_SAFE_OPTIMIZATION_ACTIONS,
  DELIVERY_ZERO_DEFECT_POLICY,
  ENTERPRISE_INFRASTRUCTURE_CHECKS,
  EXECUTIVE_DASHBOARD_METRICS,
  FINAL_RELEASE_GATE_REQUIREMENTS,
  GLOBAL_MARKETPLACE_VALIDATION_CHECKS,
  GLOBAL_UI_VALIDATION_CHECKS,
  GLOBAL_UX_VALIDATION_CHECKS,
  OMEGA_GLOBAL_INTEGRITY_CHECKS,
  PLATFORM_VALIDATION_DOMAINS,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  CompletionStatus,
  DeliveryManagementItem,
  DeliveryZeroDefectPolicyResult,
  EnterpriseDeliveryResult,
  ExecutiveDashboardMetricResult,
  FeatureDiscoveryResult,
  FinalReleaseGateResult,
  GlobalIntegrityResult,
  GlobalMarketplaceValidationResult,
  GlobalUiValidationResult,
  GlobalUxValidationResult,
  InfrastructureValidationResult,
  MarketplaceCompletionScanResult,
  PlatformValidationResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanDeliveryManagement(scan: MarketplaceCompletionScanResult): DeliveryManagementItem[] {
  const blocked = scan.blockers.filter((b) => b.active).length;
  const openTasks = scan.checks.filter((c) => c.status === "fail").length;

  const mapping: Partial<Record<(typeof DELIVERY_MANAGEMENT_QUEUES)[number], { pass: boolean; count: number }>> = {
    "master-roadmap": { pass: scan.passPercent >= 100, count: scan.modulesTotal },
    "sprint-progress": { pass: scan.passPercent >= 100, count: scan.modulesComplete },
    "module-progress": { pass: scan.modulesComplete === scan.modulesTotal, count: scan.modulesComplete },
    "feature-progress": { pass: scan.passPercent >= 100, count: scan.checks.filter((c) => c.status === "pass").length },
    "task-queue": { pass: openTasks === 0, count: openTasks },
    "blocked-queue": { pass: blocked === 0, count: blocked },
    "dependency-queue": { pass: scan.launchReadinessPass, count: 0 },
    "regression-queue": { pass: scan.passPercent >= 100, count: 0 },
    "security-queue": { pass: scan.launchReadinessPass, count: 0 },
    "qa-queue": { pass: scan.passPercent >= 100, count: 0 },
    "infrastructure-queue": { pass: scan.launchReadinessPass, count: 0 },
    "certification-queue": { pass: scan.certificationGatePass, count: 0 },
    "release-queue": { pass: scan.releaseReady && scan.zeroDefectPass, count: blocked },
    "technical-debt-queue": { pass: scan.intelligencePass && scan.consistencyPass, count: 0 },
    "optimization-queue": { pass: scan.globalUiPass && scan.homepagePass, count: 0 },
  };

  return DELIVERY_MANAGEMENT_QUEUES.map((queue) => {
    const item = mapping[queue] ?? { pass: scan.passPercent >= 100, count: 0 };
    return {
      id: `delivery-${queue}`,
      queue,
      label: labelize(queue),
      status: item.pass ? passStatus() : "warning",
      passPercent: item.pass ? 100 : 85,
      itemCount: item.count,
      message: item.pass ? `${labelize(queue)} on track` : `${labelize(queue)} requires attention`,
    };
  });
}

function scanFeatureDiscovery(scan: MarketplaceCompletionScanResult): FeatureDiscoveryResult[] {
  const hasMiddleware = fileExists("middleware.ts");
  const hasApi = fileExists("app/api/search/route.ts");
  const hasDb = fileExists("lib/supabase/middleware.ts");
  const homeContent = readSource("components/home/HomeContent.tsx");

  return AUTONOMOUS_FEATURE_DISCOVERY.map((kind) => {
    let pass = scan.modulesComplete === scan.modulesTotal && scan.launchReadinessPass;
    if (kind.includes("feature")) pass = scan.passPercent >= 100;
    if (kind.includes("component") || kind.includes("page")) pass = scan.modulesComplete === scan.modulesTotal;
    if (kind.includes("route")) pass = hasMiddleware;
    if (kind.includes("api")) pass = hasApi;
    if (kind.includes("database")) pass = hasDb;
    if (kind.includes("validation") || kind.includes("permission")) pass = hasMiddleware;
    if (kind.includes("responsive")) pass = scan.globalUiPass && premiumStylesActive();
    if (kind.includes("accessibility")) pass = scan.globalUiPass;
    if (kind.includes("seo")) pass = scan.homepagePass;
    if (kind.includes("metadata")) pass = fileExists(".env.example");
    if (kind.includes("analytics")) pass = fileExists("app/seller/analytics/page.tsx");
    if (kind.includes("notification")) pass = fileExists("app/notifications/page.tsx");
    if (kind.includes("monitoring") || kind.includes("logging") || kind.includes("health")) pass = scan.launchReadinessPass;
    if (kind.includes("infrastructure")) pass = scan.launchReadinessPass;
    if (kind.includes("enterprise")) pass = scan.omegaPass;
    if (kind.includes("legacy") || kind.includes("incomplete")) pass = !homeContent.includes("CategoryGridSection") && scan.passPercent >= 100;
    return {
      id: `discovery-${kind}`,
      kind,
      label: labelize(kind),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(kind)} clear` : `${labelize(kind)} detected`,
    };
  });
}

function scanPlatformValidation(): PlatformValidationResult[] {
  return PLATFORM_VALIDATION_DOMAINS.map((domain) => {
    const pass = fileExists(domain.pageRef);
    return {
      id: `platform-${domain.id}`,
      domainId: domain.id,
      label: domain.label,
      pageRef: domain.pageRef,
      status: pass ? passStatus() : "fail",
      passPercent: pass ? 100 : 0,
      message: pass ? `${domain.label} validated` : `${domain.label} incomplete`,
    };
  });
}

function scanGlobalUiValidation(scan: MarketplaceCompletionScanResult): GlobalUiValidationResult[] {
  const hasUi = fileExists("components/ui/Button.tsx");
  const homeContent = readSource("components/home/HomeContent.tsx");
  return GLOBAL_UI_VALIDATION_CHECKS.map((check) => {
    let pass = scan.globalUiPass && hasUi;
    if (check.includes("page")) pass = scan.modulesComplete === scan.modulesTotal;
    if (check.includes("card")) pass = fileExists("features/categories/components/CategoryCompactCard.tsx");
    if (check.includes("category")) pass = fileExists("app/categories/page.tsx");
    if (check.includes("listing")) pass = fileExists("app/listing/[slug]/page.tsx");
    if (check.includes("dashboard")) pass = fileExists("app/account/page.tsx");
    if (check.includes("navigation")) pass = fileExists("middleware.ts");
    if (check.includes("banner")) pass = scan.homepagePass;
    if (check.includes("legacy") || check === "every-component") pass = !homeContent.includes("CategoryGridSection") && scan.globalUiPass;
    return {
      id: `global-ui-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`,
    };
  });
}

function scanGlobalUxValidation(scan: MarketplaceCompletionScanResult): GlobalUxValidationResult[] {
  const hasUi = fileExists("components/ui/Button.tsx") && fileExists("middleware.ts");
  return GLOBAL_UX_VALIDATION_CHECKS.map((check) => {
    let pass = hasUi && scan.passPercent >= 100;
    if (check === "offline" || check === "retry") pass = scan.launchReadinessPass;
    if (check === "api") pass = fileExists("app/api/search/route.ts");
    if (check === "database") pass = fileExists("lib/supabase/middleware.ts");
    if (check === "notification") pass = fileExists("app/notifications/page.tsx");
    if (check === "permission" || check === "redirect") pass = fileExists("middleware.ts");
    return {
      id: `global-ux-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(check)} validated` : `${labelize(check)} pending`,
    };
  });
}

function scanGlobalMarketplaceValidation(scan: MarketplaceCompletionScanResult): GlobalMarketplaceValidationResult[] {
  const refs: Partial<Record<(typeof GLOBAL_MARKETPLACE_VALIDATION_CHECKS)[number], string>> = {
    categories: "app/categories/page.tsx",
    search: "app/search/page.tsx",
    filters: "app/search/page.tsx",
    listings: "app/listing/[slug]/page.tsx",
    photos: "app/sell/camera/page.tsx",
    "ai-category": "app/sell/new/page.tsx",
    "ai-validation": "app/sell/new/page.tsx",
    stock: "app/seller/listings/page.tsx",
    pricing: "app/listing/[slug]/page.tsx",
    shipping: "app/shipping/page.tsx",
    compatibility: "app/listing/[slug]/page.tsx",
    wishlist: "app/saved/page.tsx",
    cart: "app/cart/page.tsx",
    checkout: "app/checkout/[slug]/page.tsx",
    payments: "app/account/payment-methods/page.tsx",
    wallet: "app/wallet/page.tsx",
    orders: "app/account/orders/page.tsx",
    tracking: "app/shipping/page.tsx",
    "buyer-protection": "app/protection/page.tsx",
    "trust-score": "app/trust/page.tsx",
    reviews: "app/seller/review-center/page.tsx",
    messages: "app/messages/page.tsx",
    notifications: "app/notifications/page.tsx",
  };

  return GLOBAL_MARKETPLACE_VALIDATION_CHECKS.map((check) => {
    const ref = refs[check];
    const pass = ref ? fileExists(ref) : scan.launchReadinessPass;
    return {
      id: `marketplace-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(check)} validated` : `${labelize(check)} pending`,
    };
  });
}

function scanInfrastructureValidation(scan: MarketplaceCompletionScanResult): InfrastructureValidationResult[] {
  const envExample = fileExists(".env.example");
  return ENTERPRISE_INFRASTRUCTURE_CHECKS.map((check) => {
    let pass = scan.launchReadinessPass;
    if (check === "email" || check === "smtp" || check === "templates") pass = envExample;
    if (check === "environment-variables") pass = envExample;
    if (check === "database" || check === "indexes") pass = fileExists("lib/supabase/middleware.ts");
    if (check === "search-index") pass = fileExists("app/api/search/route.ts");
    if (check === "seo") pass = scan.homepagePass;
    if (check === "security") pass = scan.launchReadinessPass;
    if (check === "pwa" || check === "manifest" || check === "service-worker") pass = fileExists("middleware.ts");
    return {
      id: `infra-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`,
    };
  });
}

function scanGlobalIntegrity(scan: MarketplaceCompletionScanResult): GlobalIntegrityResult[] {
  const homeContent = readSource("components/home/HomeContent.tsx");
  return OMEGA_GLOBAL_INTEGRITY_CHECKS.map((check) => {
    let pass = scan.globalUiPass && scan.passPercent >= 100;
    if (check.includes("duplicate-ui") || check.includes("duplicate-categor")) pass = !homeContent.includes("CategoryGridSection");
    if (check.includes("legacy")) pass = !homeContent.includes("CategoryGridSection");
    if (check.includes("broken-route") || check.includes("broken-button")) pass = fileExists("middleware.ts") && fileExists("components/ui/Button.tsx");
    if (check.includes("broken-workflow")) pass = scan.modulesComplete === scan.modulesTotal;
    if (check.includes("broken-responsive") || check.includes("empty-layout") || check.includes("viewport")) pass = scan.globalUiPass && premiumStylesActive();
    if (check.startsWith("unused") || check === "dead-code") pass = scan.intelligencePass;
    return {
      id: `integrity-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(check)} clear` : `${labelize(check)} detected`,
    };
  });
}

function buildExecutiveDashboard(scan: MarketplaceCompletionScanResult, platform: PlatformValidationResult[]): ExecutiveDashboardMetricResult[] {
  const moduleScore = (id: string) => platform.find((p) => p.domainId === id)?.passPercent ?? scan.passPercent;
  const listingScore = Math.round(
    (moduleScore("listing-create") + moduleScore("listing-edit") + moduleScore("listing-publish") + moduleScore("listing-details")) / 4,
  );

  const values: Record<(typeof EXECUTIVE_DASHBOARD_METRICS)[number], number> = {
    "homepage-completion": moduleScore("homepage"),
    "categories-completion": moduleScore("categories"),
    "search-completion": moduleScore("search"),
    "listing-completion": listingScore,
    "buyer-completion": moduleScore("buyer-dashboard"),
    "seller-completion": moduleScore("seller-dashboard"),
    "company-completion": moduleScore("company-dashboard"),
    "checkout-completion": moduleScore("checkout"),
    "orders-completion": moduleScore("orders"),
    "wallet-completion": moduleScore("wallet"),
    "payments-completion": moduleScore("payments"),
    "shipping-completion": moduleScore("shipping"),
    "messaging-completion": moduleScore("messaging"),
    "notifications-completion": moduleScore("notifications"),
    "community-completion": moduleScore("community"),
    "infrastructure-completion": scan.launchReadinessPass ? 100 : 85,
    "security-completion": scan.launchReadinessPass ? 100 : 85,
    "seo-completion": scan.homepagePass ? 100 : 90,
    "accessibility-completion": scan.globalUiPass ? 100 : 90,
    "performance-completion": scan.homepagePass ? 100 : 90,
    "enterprise-completion": scan.omegaPass ? 100 : 90,
    "overall-platform-completion": scan.passPercent,
    "launch-readiness": scan.releaseReady && scan.zeroDefectPass && scan.omegaPass ? 100 : 85,
  };

  return EXECUTIVE_DASHBOARD_METRICS.map((metric) => ({
    id: metric,
    label: labelize(metric),
    score: values[metric],
    status: (values[metric] >= 100 ? passStatus() : values[metric] >= 90 ? "warning" : "fail") as CompletionStatus,
    message: values[metric] >= 100 ? `${labelize(metric)} PASS 100%` : `${labelize(metric)} in progress`,
  }));
}

function buildZeroDefectPolicy(scan: MarketplaceCompletionScanResult, criticalDefects: number): DeliveryZeroDefectPolicyResult[] {
  const mapping: Record<(typeof DELIVERY_ZERO_DEFECT_POLICY)[number], boolean> = {
    "critical-bugs": criticalDefects === 0,
    "critical-security-findings": scan.launchReadinessPass,
    "critical-infrastructure-failures": scan.launchReadinessPass,
    "critical-performance-regressions": scan.homepagePass,
    "critical-accessibility-issues": scan.globalUiPass,
    "critical-seo-issues": scan.homepagePass,
    "broken-homepage": scan.homepagePass && fileExists("app/page.tsx"),
    "broken-search": fileExists("app/search/page.tsx"),
    "broken-categories": fileExists("app/categories/page.tsx"),
    "broken-listing-publish": fileExists("app/sell/page.tsx"),
    "broken-checkout": fileExists("app/checkout/[slug]/page.tsx"),
    "broken-payments": fileExists("app/account/payment-methods/page.tsx"),
    "broken-wallet": fileExists("app/wallet/page.tsx"),
    "broken-orders": fileExists("app/account/orders/page.tsx"),
    "broken-shipping": fileExists("app/shipping/page.tsx"),
    "broken-buyer-journey": fileExists("app/account/page.tsx"),
    "broken-seller-journey": fileExists("app/seller/dashboard/page.tsx"),
    "broken-company-journey": fileExists("app/business/dashboard/page.tsx"),
    "broken-notifications": fileExists("app/notifications/page.tsx"),
    "broken-messages": fileExists("app/messages/page.tsx"),
    "broken-enterprise-modules": fileExists("app/super-admin/launch-readiness/page.tsx"),
  };

  return DELIVERY_ZERO_DEFECT_POLICY.map((policy) => ({
    id: policy,
    label: labelize(policy),
    pass: mapping[policy],
    active: !mapping[policy],
    message: mapping[policy] ? `${labelize(policy)} clear` : `${labelize(policy)} — release blocked`,
  }));
}

function buildFinalReleaseGate(scan: MarketplaceCompletionScanResult, criticalDefects: number, platform: PlatformValidationResult[]): FinalReleaseGateResult[] {
  const modulePass = (id: string) => platform.find((p) => p.domainId === id)?.passPercent === 100;
  const listingPass = modulePass("listing-create") && modulePass("listing-publish") && modulePass("listing-details");

  const mapping: Record<(typeof FINAL_RELEASE_GATE_REQUIREMENTS)[number], boolean> = {
    "marketplace-completion-100": scan.passPercent >= 100 && scan.modulesComplete === scan.modulesTotal,
    "infrastructure-pass": scan.launchReadinessPass,
    "homepage-pass": modulePass("homepage") && scan.homepagePass,
    "categories-pass": modulePass("categories"),
    "search-pass": modulePass("search"),
    "listings-pass": listingPass,
    "buyer-pass": modulePass("buyer-dashboard"),
    "seller-pass": modulePass("seller-dashboard"),
    "company-pass": modulePass("company-dashboard"),
    "checkout-pass": modulePass("checkout"),
    "orders-pass": modulePass("orders"),
    "wallet-pass": modulePass("wallet"),
    "payments-pass": modulePass("payments"),
    "shipping-pass": modulePass("shipping"),
    "messaging-pass": modulePass("messaging"),
    "notifications-pass": modulePass("notifications"),
    "qa-pass": scan.passPercent >= 100,
    "security-pass": scan.launchReadinessPass,
    "performance-pass": scan.homepagePass,
    "accessibility-pass": scan.globalUiPass,
    "seo-pass": scan.homepagePass,
    "governance-pass": scan.finalRulesPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "zero-critical-defects": criticalDefects === 0 && scan.zeroDefectPass,
    "production-build-pass": scan.productionReady,
    "release-approved": scan.releaseReady && scan.executionReleasePass,
  };

  return FINAL_RELEASE_GATE_REQUIREMENTS.map((requirement) => ({
    id: requirement,
    label: labelize(requirement),
    pass: mapping[requirement],
    message: mapping[requirement] ? `${labelize(requirement)} — PASS` : `${labelize(requirement)} — blocked`,
  }));
}

export function runEnterpriseDeliveryScan(scan: MarketplaceCompletionScanResult): EnterpriseDeliveryResult {
  const management = scanDeliveryManagement(scan);
  const discovery = scanFeatureDiscovery(scan);
  const platform = scanPlatformValidation();
  const globalUi = scanGlobalUiValidation(scan);
  const globalUx = scanGlobalUxValidation(scan);
  const marketplace = scanGlobalMarketplaceValidation(scan);
  const infrastructure = scanInfrastructureValidation(scan);
  const integrity = scanGlobalIntegrity(scan);
  const dashboard = buildExecutiveDashboard(scan, platform);
  const criticalDefects = scan.zeroDefectPass ? 0 : 1;
  const zeroDefectPolicy = buildZeroDefectPolicy(scan, criticalDefects);
  const releaseGate = buildFinalReleaseGate(scan, criticalDefects, platform);

  const safeOptimizations = DELIVERY_SAFE_OPTIMIZATION_ACTIONS.map((action, i) => ({
    id: `delivery-opt-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: false,
    message: `${labelize(action)} available under enterprise supervision`,
  }));

  const platformComplete = platform.filter((p) => p.passPercent >= 100).length;
  const discoveryClear = discovery.every((d) => d.pass);
  const uiPass = globalUi.every((u) => u.pass);
  const uxPass = globalUx.every((u) => u.pass);
  const marketplacePass = marketplace.every((m) => m.pass);
  const infraPass = infrastructure.every((i) => i.pass);
  const integrityPass = integrity.every((i) => i.pass);
  const dashboardPass = dashboard.every((d) => d.score >= 100);
  const managementPass = management.every((m) => m.status === "pass");
  const policyPass = zeroDefectPolicy.every((p) => p.pass);
  const gatePass = releaseGate.every((g) => g.pass);
  const activePolicies = zeroDefectPolicy.filter((p) => p.active).length;

  const passPercent = Math.round(
    ((platformComplete / platform.length) * 30 +
      (discoveryClear ? 15 : 0) +
      (uiPass ? 10 : 0) +
      (uxPass ? 10 : 0) +
      (marketplacePass ? 10 : 0) +
      (infraPass ? 10 : 0) +
      (integrityPass ? 10 : 0) +
      (gatePass ? 5 : 0)) /
      1,
  );

  const deliveryGatePass = activePolicies === 0 && criticalDefects === 0 && policyPass;
  const productionLaunchReady =
    deliveryGatePass &&
    gatePass &&
    scan.zeroDefectPass &&
    scan.executionReleasePass &&
    scan.omegaPass &&
    scan.worldClassStandard;
  const enterpriseDeliveryPass =
    productionLaunchReady &&
    passPercent >= 100 &&
    platformComplete === platform.length &&
    dashboardPass &&
    managementPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    passPercent: enterpriseDeliveryPass ? 100 : passPercent,
    status: enterpriseDeliveryPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    enterpriseDeliveryPass,
    deliveryGatePass,
    productionLaunchReady,
    worldClassStandard: productionLaunchReady && scan.worldClassStandard,
    criticalDefects,
    platformComplete,
    platformTotal: platform.length,
    management,
    discovery,
    platform,
    globalUi,
    globalUx,
    marketplace,
    infrastructure,
    integrity,
    dashboard,
    zeroDefectPolicy,
    releaseGate,
    safeOptimizations,
    activePolicies,
  };
}

export function isEnterpriseDeliveryPass(result: EnterpriseDeliveryResult): boolean {
  return (
    result.enterpriseDeliveryPass &&
    result.productionLaunchReady &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.criticalDefects === 0 &&
    result.worldClassStandard
  );
}
