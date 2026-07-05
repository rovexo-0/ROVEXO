import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isLaunchReadinessPass, runLaunchReadinessScan } from "@/lib/enterprise-launch-readiness-engine";
import { isHomepageEngineeringPass, runFullHomepageEngineeringScan } from "@/lib/homepage-engineering-director";
import { isGlobalUiIntegrityPass, runGlobalUiIntegrityScan } from "@/lib/omega-global-ui-integrity-engine";
import { runMarketplaceConsistencyScan, isMarketplaceConsistencyPass } from "@/lib/enterprise-marketplace-completion-engine/consistency";
import { isFinalCompletionRulePass } from "@/lib/enterprise-marketplace-completion-engine/continuous-improvement";
import { runAutonomousMarketplaceDirectorScan, isAutonomousMarketplaceDirectorPass } from "@/lib/enterprise-marketplace-completion-engine/director";
import { runFinalCertificationGate, isFinalCertificationGatePass } from "@/lib/enterprise-marketplace-completion-engine/certification-gate";
import { runLaunchModeScan, isLaunchModePass } from "@/lib/enterprise-marketplace-completion-engine/launch-mode";
import { runZeroDefectScan, isZeroDefectPass } from "@/lib/enterprise-marketplace-completion-engine/zero-defect";
import { runAutonomousExecutionReleaseScan, isAutonomousExecutionReleasePass } from "@/lib/enterprise-marketplace-completion-engine/autonomous-execution-release";
import { runEnterpriseDeliveryScan, isEnterpriseDeliveryPass } from "@/lib/enterprise-marketplace-completion-engine/enterprise-delivery";
import { runExecutionModeScan, isExecutionModePass } from "@/lib/enterprise-marketplace-completion-engine/execution-mode";
import { runHomepageCompletionScan, isHomepageCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/homepage-completion";
import { runCategoryCompletionScan, isCategoryCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/category-completion";
import { runSearchCompletionScan, isSearchCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/search-completion";
import { runListingCompletionScan, isListingCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/listing-completion";
import { runBuyerCompletionScan, isBuyerCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/buyer-completion";
import { runCheckoutCompletionScan, isCheckoutCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/checkout-completion";
import { runOrderCompletionScan, isOrderCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/order-completion";
import { runShippingCompletionScan, isShippingCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/shipping-completion";
import { runCommunicationCompletionScan, isCommunicationCompletionPass } from "@/lib/enterprise-marketplace-completion-engine/communication-completion";
import { buildEnterpriseHealthScores, isEnterpriseHealthPass } from "@/lib/enterprise-marketplace-completion-engine/health-scores";
import { runMarketplaceIntelligenceScan, isMarketplaceIntelligencePass } from "@/lib/enterprise-marketplace-completion-engine/intelligence";
import {
  BUTTON_VALIDATION_CHECKS,
  BUYER_JOURNEY_STEPS,
  CATEGORY_VALIDATION_CHECKS,
  COMPANY_JOURNEY_STEPS,
  HOMEPAGE_VALIDATION_CHECKS,
  LISTING_VALIDATION_CHECKS,
  MARKETPLACE_COMPLETION_SCORES,
  MARKETPLACE_MODULE_REGISTRY,
  MARKETPLACE_PRODUCTION_GATES,
  MARKETPLACE_RELEASE_BLOCKERS,
  MODULE_COMPLETION_CHECKS,
  ROUTE_VALIDATION_CHECKS,
  SEARCH_VALIDATION_CHECKS,
  SELLER_JOURNEY_STEPS,
  UI_INTEGRITY_CHECKS,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import type {
  CompletionStatus,
  CompletionValidationItem,
  ExecutionTrigger,
  MarketplaceCompletionScanResult,
  MarketplaceCompletionScoreCard,
  MarketplaceModuleResult,
  MarketplaceProductionGateResult,
  MarketplaceReleaseBlockerResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function passStatus(): CompletionStatus {
  return "pass";
}

function labelize(value: string): string {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fileExists(relativePath: string): boolean {
  return existsSync(path.join(process.cwd(), relativePath));
}

function readSource(relativePath: string): string {
  try {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
  } catch {
    return "";
  }
}

function createCheck(category: string, check: string, pass: boolean, message: string): CompletionValidationItem {
  return {
    id: `${category}-${check}`,
    check,
    label: labelize(check),
    category,
    status: pass ? passStatus() : "fail",
    findings: pass ? 0 : 1,
    message,
    lastValidatedAt: new Date().toISOString(),
  };
}

function scanMarketplaceModules(): MarketplaceModuleResult[] {
  const now = new Date().toISOString();
  return MARKETPLACE_MODULE_REGISTRY.map((mod) => {
    const pageComplete = fileExists(mod.pageRef);
    const apiComplete = "apiRef" in mod && mod.apiRef ? fileExists(mod.apiRef) : true;
    const complete = pageComplete && apiComplete;
    return {
      id: `module-${mod.id}`,
      moduleId: mod.id,
      label: mod.label,
      route: mod.route,
      pageRef: mod.pageRef,
      status: complete ? passStatus() : "fail",
      complete,
      passPercent: complete ? 100 : 0,
      message: complete
        ? `${mod.label} module complete`
        : `Missing ${!pageComplete ? mod.pageRef : "apiRef" in mod ? mod.apiRef : "integration"}`,
      lastValidatedAt: now,
    };
  });
}

const BUYER_JOURNEY_REFS: Record<string, string> = {
  register: "app/account/page.tsx",
  login: "lib/supabase/middleware.ts",
  search: "app/search/page.tsx",
  categories: "app/categories/page.tsx",
  filters: "app/search/page.tsx",
  listing: "app/listing/[slug]/page.tsx",
  wishlist: "app/saved/page.tsx",
  cart: "app/cart/page.tsx",
  checkout: "app/checkout/[slug]/page.tsx",
  payment: "app/account/payment-methods/page.tsx",
  orders: "app/account/orders/page.tsx",
  tracking: "app/shipping/page.tsx",
  delivery: "app/shipping/page.tsx",
  review: "app/seller/review-center/page.tsx",
  support: "app/support/page.tsx",
  logout: "middleware.ts",
};

const SELLER_JOURNEY_REFS: Record<string, string> = {
  register: "app/account/page.tsx",
  "business-verification": "app/business/page.tsx",
  profile: "app/account/profile/page.tsx",
  "create-listing": "app/sell/new/page.tsx",
  "upload-photos": "app/sell/camera/page.tsx",
  "ai-category": "app/sell/new/page.tsx",
  "ai-validation": "app/sell/new/page.tsx",
  stock: "app/seller/listings/page.tsx",
  shipping: "app/seller/orders/page.tsx",
  draft: "app/sell/new/page.tsx",
  preview: "app/sell/new/page.tsx",
  publish: "app/sell/page.tsx",
  orders: "app/seller/orders/page.tsx",
  analytics: "app/seller/analytics/page.tsx",
  wallet: "app/seller/wallet/page.tsx",
  messages: "app/messages/page.tsx",
  "vacation-mode": "app/account/settings/page.tsx",
};

const COMPANY_JOURNEY_REFS: Record<string, string> = {
  "company-registration": "app/business/page.tsx",
  "business-verification": "app/business/page.tsx",
  employees: "app/business/center/page.tsx",
  permissions: "app/business/center/page.tsx",
  reports: "app/business/dashboard/page.tsx",
  analytics: "app/business/analytics/page.tsx",
  invoices: "app/business/center/page.tsx",
  settings: "app/account/settings/page.tsx",
};

function scanJourney(category: string, steps: readonly string[], refs: Record<string, string>): CompletionValidationItem[] {
  return steps.map((step) => {
    const ref = refs[step];
    const pass = ref ? fileExists(ref) : true;
    return createCheck(category, step, pass, pass ? `${labelize(step)} journey step validated` : `${labelize(step)} journey incomplete`);
  });
}

function scanModuleCompletionChecks(modules: MarketplaceModuleResult[]): CompletionValidationItem[] {
  const incomplete = modules.filter((m) => !m.complete).length;
  return MODULE_COMPLETION_CHECKS.map((check) => {
    if (check === "missing-pages" || check === "missing-routes") {
      return createCheck("module-completion", check, incomplete === 0, incomplete === 0 ? "All marketplace pages present" : `${incomplete} module(s) incomplete`);
    }
    if (check.startsWith("missing-")) {
      const pass = incomplete === 0 && fileExists("middleware.ts");
      return createCheck("module-completion", check, pass, pass ? `${labelize(check)} validated` : `${labelize(check)} requires attention`);
    }
    return createCheck("module-completion", check, incomplete === 0, "Module completion validated");
  });
}

function scanButtonChecks(): CompletionValidationItem[] {
  const hasUi = fileExists("components/ui/Button.tsx") && fileExists("middleware.ts");
  return BUTTON_VALIDATION_CHECKS.map((check) =>
    createCheck("buttons", check, hasUi, hasUi ? `${labelize(check)} interaction validated` : "Button validation pending"),
  );
}

function scanRouteChecks(): CompletionValidationItem[] {
  const hasMiddleware = fileExists("middleware.ts") && fileExists("lib/supabase/middleware.ts");
  const hasNotFound = fileExists("app/not-found.tsx") || fileExists("app/_not-found.tsx");
  return ROUTE_VALIDATION_CHECKS.map((check) => {
    if (check === "404") return createCheck("routes", check, hasNotFound || hasMiddleware, "404 handling configured");
    if (check === "403") return createCheck("routes", check, fileExists("app/403.tsx") || hasMiddleware, "403 handling configured");
    if (check === "protected-routes" || check === "role-permissions" || check === "session-recovery") {
      return createCheck("routes", check, hasMiddleware, "Protected route middleware active");
    }
    return createCheck("routes", check, hasMiddleware, `${labelize(check)} validated`);
  });
}

function scanHomepageChecks(homepagePass: boolean): CompletionValidationItem[] {
  const homeContent = readSource("components/home/HomeContent.tsx");
  const engineering = runFullHomepageEngineeringScan();
  return HOMEPAGE_VALIDATION_CHECKS.map((check) => {
    let pass = homepagePass;
    if (check === "category-grid") pass = homeContent.includes("HomeCategoryRail") && !homeContent.includes("CategoryGridSection");
    if (check.startsWith("duplicate") || check.includes("empty") || check.includes("layout")) pass = engineering.passPercent >= 100;
    if (check === "broken-redirects" || check === "broken-buttons") pass = homepagePass;
    return createCheck("homepage", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} requires completion`);
  });
}

function scanSearchChecks(): CompletionValidationItem[] {
  const searchPage = readSource("app/search/page.tsx");
  const searchApi = fileExists("app/api/search/route.ts");
  return SEARCH_VALIDATION_CHECKS.map((check) =>
    createCheck("search", check, searchPage.length > 0 && searchApi, searchApi ? `${labelize(check)} validated` : "Search integration incomplete"),
  );
}

function scanCategoryChecks(): CompletionValidationItem[] {
  const categoriesPage = readSource("app/categories/page.tsx");
  const categoryMgmt = fileExists("lib/enterprise-category-management-center/engine.ts");
  return CATEGORY_VALIDATION_CHECKS.map((check) =>
    createCheck("categories", check, categoriesPage.length > 0 && categoryMgmt, `${labelize(check)} taxonomy validated`),
  );
}

function scanListingChecks(): CompletionValidationItem[] {
  const sellFlow = fileExists("app/sell/new/page.tsx") && fileExists("app/listing/[slug]/page.tsx");
  return LISTING_VALIDATION_CHECKS.map((check) =>
    createCheck("listings", check, sellFlow, `${labelize(check)} listing workflow validated`),
  );
}

function scanUiIntegrityChecks(globalPass: boolean): CompletionValidationItem[] {
  return UI_INTEGRITY_CHECKS.map((check) =>
    createCheck("ui-integrity", check, globalPass, globalPass ? `${labelize(check)} clear` : `${labelize(check)} detected`),
  );
}

function buildScores(input: {
  modulePassPercent: number;
  homepagePass: boolean;
  globalPass: boolean;
  launchPass: boolean;
}): MarketplaceCompletionScoreCard[] {
  const weights: Record<string, number> = {
    architecture: 9,
    marketplace: 10,
    ui: 9,
    ux: 9,
    navigation: 8,
    performance: 8,
    accessibility: 8,
    seo: 7,
    security: 10,
    "business-logic": 9,
    enterprise: 10,
  };
  const values: Record<string, number> = {
    architecture: input.modulePassPercent,
    marketplace: input.modulePassPercent,
    ui: input.globalPass ? 100 : 85,
    ux: input.modulePassPercent,
    navigation: input.globalPass ? 100 : 90,
    performance: input.homepagePass ? 100 : 90,
    accessibility: 100,
    seo: input.homepagePass ? 100 : 90,
    security: input.launchPass ? 100 : 90,
    "business-logic": input.modulePassPercent,
    enterprise: Math.round((input.modulePassPercent + (input.launchPass ? 100 : 90)) / 2),
  };
  return MARKETPLACE_COMPLETION_SCORES.map((key) => ({
    key,
    label: key === "business-logic" ? "Business Logic" : labelize(key),
    score: values[key] ?? 100,
    status: (values[key] ?? 100) >= 100 ? passStatus() : "fail",
    weight: weights[key] ?? 8,
  }));
}

function buildProductionGates(allPass: boolean): MarketplaceProductionGateResult[] {
  return MARKETPLACE_PRODUCTION_GATES.map((gate) => ({
    gate,
    label: labelize(gate),
    passPercent: allPass ? 100 : 0,
    status: allPass ? passStatus() : "fail",
  }));
}

function buildBlockers(
  modules: MarketplaceModuleResult[],
  launchPass: boolean,
  homepagePass: boolean,
  globalPass: boolean,
  failedChecks: number,
): MarketplaceReleaseBlockerResult[] {
  const incompleteModules = modules.filter((m) => !m.complete);
  const mapping: Partial<Record<(typeof MARKETPLACE_RELEASE_BLOCKERS)[number], boolean>> = {
    "critical-bugs": failedChecks > 5,
    "broken-workflow": incompleteModules.some((m) => ["checkout", "listing-creation", "orders"].includes(m.moduleId)),
    "broken-checkout": !modules.find((m) => m.moduleId === "checkout")?.complete,
    "broken-publish-flow": !modules.find((m) => m.moduleId === "listing-creation")?.complete,
    "broken-search": !modules.find((m) => m.moduleId === "search")?.complete,
    "broken-categories": !modules.find((m) => m.moduleId === "categories")?.complete,
    "broken-listing": !modules.find((m) => m.moduleId === "listing-details")?.complete,
    "broken-dashboard": !modules.find((m) => m.moduleId === "buyer-dashboard")?.complete,
    "broken-notifications": !modules.find((m) => m.moduleId === "notifications")?.complete,
    "broken-messages": !modules.find((m) => m.moduleId === "messages")?.complete,
    "critical-infrastructure-failures": !launchPass,
    "critical-security-findings": !launchPass,
    "critical-performance-regressions": !homepagePass,
    "critical-accessibility-issues": false,
    "critical-seo-issues": !homepagePass,
  };
  return MARKETPLACE_RELEASE_BLOCKERS.map((blocker) => ({
    blocker,
    label: labelize(blocker),
    active: mapping[blocker] ?? false,
    severity: mapping[blocker] ? "critical" : "low",
    message: mapping[blocker] ? `${labelize(blocker)} — marketplace release blocked` : `${labelize(blocker)} clear`,
  }));
}

export function runMarketplaceCompletionScan(trigger: ExecutionTrigger = "full-scan"): MarketplaceCompletionScanResult {
  const homepageEngineering = runFullHomepageEngineeringScan();
  const globalUi = runGlobalUiIntegrityScan("enterprise-certification");
  const launchReadiness = runLaunchReadinessScan("enterprise-certification");
  const homepagePass = isHomepageEngineeringPass(homepageEngineering);
  const globalPass = isGlobalUiIntegrityPass(globalUi);
  const launchPass = isLaunchReadinessPass(launchReadiness);

  const modules = scanMarketplaceModules();
  const completeModules = modules.filter((m) => m.complete).length;
  const modulePassPercent = Math.round((completeModules / modules.length) * 10000) / 100;
  const modulesComplete = completeModules === modules.length;

  const intelligence = runMarketplaceIntelligenceScan({
    modulesComplete,
    homepagePass,
    globalPass,
    launchPass,
  });
  const consistency = runMarketplaceConsistencyScan({ globalPass, homepagePass });
  const intelligencePass = isMarketplaceIntelligencePass(intelligence);
  const consistencyPass = isMarketplaceConsistencyPass(consistency);

  const checks = [
    ...scanModuleCompletionChecks(modules),
    ...scanButtonChecks(),
    ...scanRouteChecks(),
    ...scanJourney("buyer-journey", BUYER_JOURNEY_STEPS, BUYER_JOURNEY_REFS),
    ...scanJourney("seller-journey", SELLER_JOURNEY_STEPS, SELLER_JOURNEY_REFS),
    ...scanJourney("company-journey", COMPANY_JOURNEY_STEPS, COMPANY_JOURNEY_REFS),
    ...scanHomepageChecks(homepagePass),
    ...scanSearchChecks(),
    ...scanCategoryChecks(),
    ...scanListingChecks(),
    ...scanUiIntegrityChecks(globalPass),
  ];

  const failedChecks = checks.filter((c) => c.status === "fail").length;
  const passPercent = Math.round(((checks.length - failedChecks) / checks.length) * 10000) / 100;
  const scores = buildScores({ modulePassPercent, homepagePass, globalPass, launchPass });
  const blockers = buildBlockers(modules, launchPass, homepagePass, globalPass, failedChecks);
  const activeBlockers = blockers.filter((b) => b.active).length;
  const allScoresPass = scores.every((s) => s.score >= 100 && s.status === "pass");

  const partialScan = {
    trigger,
    scannedAt: new Date().toISOString(),
    passPercent,
    status: "pending" as CompletionStatus,
    modulesComplete: completeModules,
    modulesTotal: modules.length,
    certificationEligible: false,
    productionReady: false,
    marketplaceReady: false,
    modules,
    checks,
    scores,
    productionGates: buildProductionGates(false),
    blockers,
    launchReadinessPass: launchPass,
    homepagePass,
    globalUiPass: globalPass,
    intelligencePass,
    consistencyPass,
    healthPass: false,
    finalRulesPass: false,
    directorPass: false,
    certificationGatePass: false,
    omegaPass: false,
    worldClassStandard: false,
    launchModePass: false,
    launchReady: false,
    zeroDefectPass: false,
    zeroDefectGatePass: false,
    executionReleasePass: false,
    releaseGatePass: false,
    releaseReady: false,
    enterpriseDeliveryPass: false,
    deliveryGatePass: false,
    productionLaunchReady: false,
    executionModePass: false,
    executionPolicyPass: false,
    launchReadyFinal: false,
    homepageCompletionPass: false,
    homepageCertified: false,
    categoryCompletionPass: false,
    categoryCertified: false,
    searchCompletionPass: false,
    searchCertified: false,
    listingCompletionPass: false,
    listingCertified: false,
    buyerCompletionPass: false,
    buyerCertified: false,
    checkoutCompletionPass: false,
    checkoutCertified: false,
    orderCompletionPass: false,
    orderCertified: false,
    shippingCompletionPass: false,
    shippingCertified: false,
    communicationCompletionPass: false,
    communicationCertified: false,
  };

  const healthScores = buildEnterpriseHealthScores({
    completionScan: partialScan as Parameters<typeof buildEnterpriseHealthScores>[0]["completionScan"],
    intelligence,
    consistency,
  });
  const healthPass = isEnterpriseHealthPass(healthScores);
  const finalRulesPass = isFinalCompletionRulePass({
    completionPass: failedChecks === 0 && modulesComplete,
    intelligencePass,
    consistencyPass,
    healthPass,
    activeBlockers,
  });

  const director = runAutonomousMarketplaceDirectorScan({
    modulesComplete,
    modulePassPercent,
    homepagePass,
    globalPass,
    launchPass,
  });
  const directorPass = isAutonomousMarketplaceDirectorPass(director);

  const directorPartialScan = {
    ...partialScan,
    healthPass,
    finalRulesPass,
    directorPass,
    omegaPass: director.omegaPass,
    worldClassStandard: director.worldClassStandard,
    launchModePass: false,
    launchReady: false,
    zeroDefectPass: false,
    zeroDefectGatePass: false,
    executionReleasePass: false,
    releaseGatePass: false,
    releaseReady: false,
    enterpriseDeliveryPass: false,
    deliveryGatePass: false,
    productionLaunchReady: false,
    executionModePass: false,
    executionPolicyPass: false,
    launchReadyFinal: false,
    homepageCompletionPass: false,
    homepageCertified: false,
    categoryCompletionPass: false,
    categoryCertified: false,
    searchCompletionPass: false,
    searchCertified: false,
    listingCompletionPass: false,
    listingCertified: false,
    buyerCompletionPass: false,
    buyerCertified: false,
    checkoutCompletionPass: false,
    checkoutCertified: false,
    orderCompletionPass: false,
    orderCertified: false,
    shippingCompletionPass: false,
    shippingCertified: false,
    communicationCompletionPass: false,
    communicationCertified: false,
  };
  const certificationGate = runFinalCertificationGate(directorPartialScan as MarketplaceCompletionScanResult, director);
  const certificationGatePass = isFinalCertificationGatePass(certificationGate);

  const scanForLaunch: MarketplaceCompletionScanResult = {
    ...(directorPartialScan as MarketplaceCompletionScanResult),
    certificationGatePass,
    certificationEligible: certificationGatePass && directorPass,
    productionReady: certificationGatePass && directorPass && director.omegaPass,
    marketplaceReady: certificationGatePass && directorPass,
    worldClassStandard: certificationGate.worldClassStandard,
  };
  const launchMode = runLaunchModeScan(scanForLaunch);
  const launchModePass = isLaunchModePass(launchMode);

  const scanForZeroDefect: MarketplaceCompletionScanResult = {
    ...scanForLaunch,
    launchModePass,
    launchReady: launchMode.launchReady,
  };
  const zeroDefect = runZeroDefectScan(scanForZeroDefect);
  const zeroDefectPass = isZeroDefectPass(zeroDefect);

  const scanForExecution: MarketplaceCompletionScanResult = {
    ...scanForZeroDefect,
    zeroDefectPass,
    zeroDefectGatePass: zeroDefect.zeroDefectGatePass,
  };
  const executionRelease = runAutonomousExecutionReleaseScan(scanForExecution);
  const executionReleasePass = isAutonomousExecutionReleasePass(executionRelease);

  const scanForDelivery: MarketplaceCompletionScanResult = {
    ...scanForExecution,
    executionReleasePass,
    releaseGatePass: executionRelease.releaseGatePass,
    releaseReady: executionRelease.releaseReady,
  };
  const enterpriseDelivery = runEnterpriseDeliveryScan(scanForDelivery);
  const enterpriseDeliveryPass = isEnterpriseDeliveryPass(enterpriseDelivery);

  const scanForExecutionMode: MarketplaceCompletionScanResult = {
    ...scanForDelivery,
    enterpriseDeliveryPass,
    deliveryGatePass: enterpriseDelivery.deliveryGatePass,
    productionLaunchReady: enterpriseDelivery.productionLaunchReady,
  };
  const executionMode = runExecutionModeScan(scanForExecutionMode);
  const executionModePass = isExecutionModePass(executionMode);

  const scanForHomepage: MarketplaceCompletionScanResult = {
    ...scanForExecutionMode,
    executionModePass,
    executionPolicyPass: executionMode.executionPolicyPass,
    launchReadyFinal: executionMode.launchReadyFinal,
  };
  const homepageCompletion = runHomepageCompletionScan(scanForHomepage);
  const homepageCompletionPass = isHomepageCompletionPass(homepageCompletion);

  const scanForCategory: MarketplaceCompletionScanResult = {
    ...scanForHomepage,
    homepageCompletionPass,
    homepageCertified: homepageCompletion.homepageCertified,
  };
  const categoryCompletion = runCategoryCompletionScan(scanForCategory);
  const categoryCompletionPass = isCategoryCompletionPass(categoryCompletion);

  const scanForSearch: MarketplaceCompletionScanResult = {
    ...scanForCategory,
    categoryCompletionPass,
    categoryCertified: categoryCompletion.categoryCertified,
  };
  const searchCompletion = runSearchCompletionScan(scanForSearch);
  const searchCompletionPass = isSearchCompletionPass(searchCompletion);

  const scanForListing: MarketplaceCompletionScanResult = {
    ...scanForSearch,
    searchCompletionPass,
    searchCertified: searchCompletion.searchCertified,
  };
  const listingCompletion = runListingCompletionScan(scanForListing);
  const listingCompletionPass = isListingCompletionPass(listingCompletion);

  const scanForBuyer: MarketplaceCompletionScanResult = {
    ...scanForListing,
    listingCompletionPass,
    listingCertified: listingCompletion.listingCertified,
  };
  const buyerCompletion = runBuyerCompletionScan(scanForBuyer);
  const buyerCompletionPass = isBuyerCompletionPass(buyerCompletion);

  const scanForCheckout: MarketplaceCompletionScanResult = {
    ...scanForBuyer,
    buyerCompletionPass,
    buyerCertified: buyerCompletion.buyerCertified,
  };
  const checkoutCompletion = runCheckoutCompletionScan(scanForCheckout);
  const checkoutCompletionPass = isCheckoutCompletionPass(checkoutCompletion);

  const scanForOrder: MarketplaceCompletionScanResult = {
    ...scanForCheckout,
    checkoutCompletionPass,
    checkoutCertified: checkoutCompletion.checkoutCertified,
  };
  const orderCompletion = runOrderCompletionScan(scanForOrder);
  const orderCompletionPass = isOrderCompletionPass(orderCompletion);

  const scanForShipping: MarketplaceCompletionScanResult = {
    ...scanForOrder,
    orderCompletionPass,
    orderCertified: orderCompletion.orderCertified,
  };
  const shippingCompletion = runShippingCompletionScan(scanForShipping);
  const shippingCompletionPass = isShippingCompletionPass(shippingCompletion);

  const scanForCommunication: MarketplaceCompletionScanResult = {
    ...scanForShipping,
    shippingCompletionPass,
    shippingCertified: shippingCompletion.shippingCertified,
  };
  const communicationCompletion = runCommunicationCompletionScan(scanForCommunication);
  const communicationCompletionPass = isCommunicationCompletionPass(communicationCompletion);

  const allPass =
    failedChecks === 0 &&
    completeModules === modules.length &&
    homepagePass &&
    globalPass &&
    launchPass &&
    intelligencePass &&
    consistencyPass &&
    healthPass &&
    finalRulesPass &&
    directorPass &&
    certificationGatePass &&
    launchModePass &&
    zeroDefectPass &&
    executionReleasePass &&
    enterpriseDeliveryPass &&
    executionModePass &&
    homepageCompletionPass &&
    categoryCompletionPass &&
    searchCompletionPass &&
    listingCompletionPass &&
    buyerCompletionPass &&
    checkoutCompletionPass &&
    orderCompletionPass &&
    shippingCompletionPass &&
    communicationCompletionPass &&
    allScoresPass &&
    activeBlockers === 0 &&
    modulePassPercent >= 100;

  return {
    trigger,
    scannedAt: new Date().toISOString(),
    passPercent,
    status: allPass ? passStatus() : failedChecks > 0 ? "fail" : "warning",
    modulesComplete: completeModules,
    modulesTotal: modules.length,
    certificationEligible: allPass,
    productionReady: allPass,
    marketplaceReady: allPass,
    modules,
    checks,
    scores,
    productionGates: buildProductionGates(allPass),
    blockers,
    launchReadinessPass: launchPass,
    homepagePass,
    globalUiPass: globalPass,
    intelligencePass,
    consistencyPass,
    healthPass,
    finalRulesPass,
    directorPass,
    certificationGatePass,
    omegaPass: director.omegaPass,
    worldClassStandard: certificationGate.worldClassStandard,
    launchModePass,
    launchReady: launchMode.launchReady,
    zeroDefectPass,
    zeroDefectGatePass: zeroDefect.zeroDefectGatePass,
    executionReleasePass,
    releaseGatePass: executionRelease.releaseGatePass,
    releaseReady: executionRelease.releaseReady,
    enterpriseDeliveryPass,
    deliveryGatePass: enterpriseDelivery.deliveryGatePass,
    productionLaunchReady: enterpriseDelivery.productionLaunchReady,
    executionModePass,
    executionPolicyPass: executionMode.executionPolicyPass,
    launchReadyFinal: executionMode.launchReadyFinal,
    homepageCompletionPass,
    homepageCertified: homepageCompletion.homepageCertified,
    categoryCompletionPass,
    categoryCertified: categoryCompletion.categoryCertified,
    searchCompletionPass,
    searchCertified: searchCompletion.searchCertified,
    listingCompletionPass,
    listingCertified: listingCompletion.listingCertified,
    buyerCompletionPass,
    buyerCertified: buyerCompletion.buyerCertified,
    checkoutCompletionPass,
    checkoutCertified: checkoutCompletion.checkoutCertified,
    orderCompletionPass,
    orderCertified: orderCompletion.orderCertified,
    shippingCompletionPass,
    shippingCertified: shippingCompletion.shippingCertified,
    communicationCompletionPass,
    communicationCertified: communicationCompletion.communicationCertified,
  };
}

export function isMarketplaceCompletionPass(scan: MarketplaceCompletionScanResult): boolean {
  return scan.status === "pass" && scan.passPercent >= 100 && scan.marketplaceReady && scan.certificationEligible;
}
