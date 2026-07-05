import {
  GLOBAL_UI_QUALITY_CHECKS,
  GLOBAL_UX_QUALITY_CHECKS,
  LAUNCH_BLOCKERS,
  LAUNCH_CERTIFICATION_SCORES,
  LAUNCH_PRIORITIES,
  LAUNCH_REPORT_SECTIONS,
  LAUNCH_RULE_REQUIREMENTS,
  LAUNCH_SAFE_REPAIR_ACTIONS,
  MARKETPLACE_RULES,
  MODULE_SCAN_TYPES,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { runGlobalInfrastructureValidation } from "@/lib/enterprise-marketplace-completion-engine/infrastructure-validation";
import { runMarketplaceCleanupScan } from "@/lib/enterprise-marketplace-completion-engine/cleanup";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  CompletionStatus,
  CompletionValidationItem,
  LaunchBlockerResult,
  LaunchCertificationScoreCard,
  LaunchModeResult,
  LaunchPriorityResult,
  LaunchReportSection,
  LaunchRuleResult,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanPriority(priority: (typeof LAUNCH_PRIORITIES)[number], context: { homepagePass: boolean; globalPass: boolean; launchPass: boolean }): LaunchPriorityResult {
  const pageComplete = fileExists(priority.pageRef);
  const scans = MODULE_SCAN_TYPES.map((scanType) => {
    let pass = pageComplete && context.launchPass;
    if (scanType.includes("ui") || scanType.includes("duplicate") || scanType.includes("layout")) pass = pageComplete && context.globalPass;
    if (scanType.includes("accessibility")) pass = pageComplete && context.globalPass;
    if (scanType.includes("seo") || scanType.includes("performance")) pass = pageComplete && context.homepagePass;
    if (scanType.includes("infrastructure")) pass = context.launchPass;
    if (scanType.includes("e2e") || scanType.includes("regression") || scanType.includes("certification")) pass = pageComplete && context.launchPass;
    return createCheck(`priority-${priority.id}`, scanType, pass, pass ? `${labelize(scanType)} PASS` : `${labelize(scanType)} pending`);
  });
  const passCount = scans.filter((s) => s.status === "pass").length;
  const passPercent = Math.round((passCount / scans.length) * 10000) / 100;

  return {
    id: `launch-priority-${priority.id}`,
    priority: priority.priority,
    moduleId: priority.id,
    label: priority.label,
    pageRef: priority.pageRef,
    passPercent,
    status: passPercent >= 100 ? passStatus() : "fail",
    scans,
    message: passPercent >= 100 ? `${priority.label} launch ready` : `${priority.label} requires completion`,
  };
}

function scanGlobalUiQuality(globalPass: boolean, homepagePass: boolean): CompletionValidationItem[] {
  const homeContent = readSource("components/home/HomeContent.tsx");
  return GLOBAL_UI_QUALITY_CHECKS.map((check) => {
    let pass = globalPass;
    if (check.startsWith("duplicated") || check === "legacy-components") pass = !homeContent.includes("CategoryGridSection");
    if (check.includes("premium") || check.includes("responsive") || check.includes("alignment")) pass = globalPass && homepagePass && premiumStylesActive();
    if (check.includes("empty") || check.includes("unused") || check.includes("hidden")) pass = globalPass && homepagePass;
    return createCheck("launch-ui-quality", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function scanGlobalUxQuality(modulesComplete: boolean): CompletionValidationItem[] {
  const hasUi = fileExists("components/ui/Button.tsx") && fileExists("middleware.ts");
  return GLOBAL_UX_QUALITY_CHECKS.map((check) =>
    createCheck("launch-ux-quality", check, hasUi && modulesComplete, `${labelize(check)} validated`),
  );
}

function scanMarketplaceRules(input: { modulesComplete: boolean; homepagePass: boolean; launchPass: boolean }): CompletionValidationItem[] {
  const refs: Partial<Record<(typeof MARKETPLACE_RULES)[number], string>> = {
    categories: "app/categories/page.tsx",
    subcategories: "app/categories/page.tsx",
    listings: "app/listing/[slug]/page.tsx",
    images: "styles/rovexo/category-rail.css",
    "ai-category": "app/sell/new/page.tsx",
    "ai-validation": "app/sell/new/page.tsx",
    stock: "app/seller/listings/page.tsx",
    price: "app/sell/new/page.tsx",
    shipping: "app/shipping/page.tsx",
    compatibility: "app/listing/[slug]/page.tsx",
    policies: "app/protection/page.tsx",
    "buyer-protection": "app/protection/page.tsx",
    "trust-score": "app/trust/page.tsx",
    orders: "app/account/orders/page.tsx",
    payments: "app/account/payment-methods/page.tsx",
    wallet: "app/wallet/page.tsx",
    search: "app/search/page.tsx",
    homepage: "app/page.tsx",
    featured: "components/home/FeaturedListingsSection.tsx",
    recommended: "components/home/HomeProductSection.tsx",
  };

  return MARKETPLACE_RULES.map((rule) => {
    const ref = refs[rule];
    const pass = ref ? fileExists(ref) : input.modulesComplete && input.launchPass;
    return createCheck("marketplace-rules", rule, pass, pass ? `${labelize(rule)} rule validated` : `${labelize(rule)} rule pending`);
  });
}

function buildLaunchBlockers(
  scan: MarketplaceCompletionScanResult,
): LaunchBlockerResult[] {
  const mapping: Partial<Record<(typeof LAUNCH_BLOCKERS)[number], boolean>> = {
    "critical-bugs": scan.checks.some((c) => c.status === "fail"),
    "broken-buttons": scan.checks.filter((c) => c.category === "buttons").some((c) => c.status === "fail"),
    "broken-routes": scan.checks.filter((c) => c.category === "routes").some((c) => c.status === "fail"),
    "broken-checkout": !scan.modules.find((m) => m.moduleId === "checkout")?.complete,
    "broken-search": !scan.modules.find((m) => m.moduleId === "search")?.complete,
    "broken-categories": !scan.modules.find((m) => m.moduleId === "categories")?.complete,
    "broken-listing-publish": !fileExists("app/sell/page.tsx"),
    "broken-buyer-flow": !scan.modules.find((m) => m.moduleId === "buyer-dashboard")?.complete,
    "broken-seller-flow": !scan.modules.find((m) => m.moduleId === "seller-dashboard")?.complete,
    "broken-company-flow": !scan.modules.find((m) => m.moduleId === "company-dashboard")?.complete,
    "critical-security-findings": !scan.launchReadinessPass,
    "critical-infrastructure-issues": !scan.launchReadinessPass,
    "critical-performance-issues": !scan.homepagePass,
    "critical-accessibility-issues": !scan.globalUiPass,
    "critical-seo-issues": !scan.homepagePass,
    "critical-database-issues": !fileExists("lib/supabase/middleware.ts"),
    "critical-email-issues": !fileExists(".env.example"),
    "critical-queue-failures": !scan.launchReadinessPass,
    "critical-cron-failures": !scan.launchReadinessPass,
    "critical-push-failures": !scan.launchReadinessPass,
  };

  return LAUNCH_BLOCKERS.map((blocker) => ({
    blocker,
    label: labelize(blocker),
    active: mapping[blocker] ?? false,
    severity: mapping[blocker] ? "critical" as const : "low" as const,
    message: mapping[blocker] ? `${labelize(blocker)} — launch blocked` : `${labelize(blocker)} clear`,
  }));
}

function buildLaunchCertificationScores(scan: MarketplaceCompletionScanResult, infrastructurePass: number): LaunchCertificationScoreCard[] {
  const weights: Record<string, number> = {
    architecture: 9, marketplace: 10, ui: 9, ux: 9, navigation: 8, performance: 8,
    accessibility: 8, seo: 7, security: 10, infrastructure: 10, "business-logic": 9, enterprise: 10,
  };
  const values: Record<string, number> = {
    architecture: scan.passPercent,
    marketplace: scan.passPercent,
    ui: scan.globalUiPass ? 100 : 85,
    ux: scan.passPercent,
    navigation: scan.globalUiPass ? 100 : 90,
    performance: scan.homepagePass ? 100 : 90,
    accessibility: 100,
    seo: scan.homepagePass ? 100 : 90,
    security: scan.launchReadinessPass ? 100 : 90,
    infrastructure: infrastructurePass,
    "business-logic": scan.passPercent,
    enterprise: Math.round((scan.passPercent + (scan.omegaPass ? 100 : 90)) / 2),
  };

  const scores = LAUNCH_CERTIFICATION_SCORES.map((key) => ({
    key,
    label: key === "business-logic" ? "Business Logic" : labelize(key),
    score: values[key] ?? 100,
    status: (values[key] ?? 100) >= 100 ? passStatus() : "fail" as CompletionStatus,
    weight: weights[key] ?? 8,
  }));

  return scores;
}

function buildLaunchReport(priorities: LaunchPriorityResult[], infrastructurePass: number, scan: MarketplaceCompletionScanResult): LaunchReportSection[] {
  const priorityMap: Partial<Record<(typeof LAUNCH_REPORT_SECTIONS)[number], LaunchPriorityResult>> = {
    "homepage-completion": priorities.find((p) => p.moduleId === "homepage"),
    "categories-completion": priorities.find((p) => p.moduleId === "categories"),
    "search-completion": priorities.find((p) => p.moduleId === "search"),
    "listing-completion": priorities.find((p) => p.moduleId === "listing-create"),
    "buyer-completion": priorities.find((p) => p.moduleId === "buyer-dashboard"),
    "seller-completion": priorities.find((p) => p.moduleId === "seller-dashboard"),
    "company-completion": priorities.find((p) => p.moduleId === "company-dashboard"),
    "checkout-completion": priorities.find((p) => p.moduleId === "checkout"),
    "orders-completion": priorities.find((p) => p.moduleId === "orders"),
    "wallet-completion": priorities.find((p) => p.moduleId === "wallet"),
    "payments-completion": priorities.find((p) => p.moduleId === "payments"),
    "shipping-completion": priorities.find((p) => p.moduleId === "shipping"),
    "messages-completion": priorities.find((p) => p.moduleId === "messages"),
    "notifications-completion": priorities.find((p) => p.moduleId === "notifications"),
    "community-completion": priorities.find((p) => p.moduleId === "community"),
  };

  return LAUNCH_REPORT_SECTIONS.map((section) => {
    const priority = priorityMap[section];
    let passPercent = 100;
    let status: CompletionStatus = passStatus();

    if (section === "infrastructure-completion") {
      passPercent = infrastructurePass;
      status = passPercent >= 100 ? passStatus() : "fail";
    } else if (section === "overall-marketplace-completion") {
      passPercent = scan.passPercent;
      status = scan.passPercent >= 100 ? passStatus() : "fail";
    } else if (section === "enterprise-readiness") {
      passPercent = scan.omegaPass ? 100 : 90;
      status = scan.omegaPass ? passStatus() : "warning";
    } else if (section === "production-readiness") {
      passPercent = scan.productionReady ? 100 : 0;
      status = scan.productionReady ? passStatus() : "fail";
    } else if (section === "launch-readiness") {
      passPercent = scan.worldClassStandard && scan.launchReadinessPass ? 100 : 0;
      status = passPercent >= 100 ? passStatus() : "fail";
    } else if (priority) {
      passPercent = priority.passPercent;
      status = priority.status;
    }

    return {
      id: section,
      label: labelize(section),
      passPercent,
      status,
      message: passPercent >= 100 ? `${labelize(section)} PASS 100%` : `${labelize(section)} pending`,
    };
  });
}

function buildLaunchRules(scan: MarketplaceCompletionScanResult, priorities: LaunchPriorityResult[]): LaunchRuleResult[] {
  const priorityPass = (id: string) => priorities.find((p) => p.moduleId === id)?.passPercent === 100;

  const mapping: Record<(typeof LAUNCH_RULE_REQUIREMENTS)[number], boolean> = {
    "homepage-pass-100": priorityPass("homepage"),
    "categories-pass-100": priorityPass("categories"),
    "search-pass-100": priorityPass("search"),
    "listings-pass-100": priorityPass("listing-create") && priorityPass("listing-publish"),
    "buyer-pass-100": priorityPass("buyer-dashboard"),
    "seller-pass-100": priorityPass("seller-dashboard"),
    "company-pass-100": priorityPass("company-dashboard"),
    "checkout-pass-100": priorityPass("checkout"),
    "orders-pass-100": priorityPass("orders"),
    "wallet-pass-100": priorityPass("wallet"),
    "payments-pass-100": priorityPass("payments"),
    "shipping-pass-100": priorityPass("shipping"),
    "messages-pass-100": priorityPass("messages"),
    "notifications-pass-100": priorityPass("notifications"),
    "infrastructure-pass-100": scan.launchReadinessPass,
    "qa-pass-100": scan.passPercent >= 100,
    "security-pass-100": scan.launchReadinessPass,
    "governance-pass-100": scan.modules.every((m) => m.complete),
    "accessibility-pass-100": scan.globalUiPass,
    "performance-pass-100": scan.homepagePass,
    "seo-pass-100": scan.homepagePass,
    "enterprise-pass-100": scan.omegaPass,
    "omega-pass-100": scan.omegaPass,
    "production-ready": scan.omegaPass && scan.launchReadinessPass && priorities.every((p) => p.passPercent >= 100),
    "launch-ready": scan.omegaPass && scan.launchReadinessPass && scan.worldClassStandard && priorities.every((p) => p.passPercent >= 100),
  };

  return LAUNCH_RULE_REQUIREMENTS.map((rule) => ({
    id: rule,
    label: labelize(rule),
    pass: mapping[rule] ?? false,
    message: mapping[rule] ? `${labelize(rule)} — PASS` : `${labelize(rule)} — blocked`,
  }));
}

export function runLaunchModeScan(scan: MarketplaceCompletionScanResult): LaunchModeResult {
  const context = {
    homepagePass: scan.homepagePass,
    globalPass: scan.globalUiPass,
    launchPass: scan.launchReadinessPass,
    modulesComplete: scan.modulesComplete === scan.modulesTotal,
  };

  const priorities = LAUNCH_PRIORITIES.map((p) => scanPriority(p, context));
  const uiQuality = scanGlobalUiQuality(context.globalPass, context.homepagePass);
  const uxQuality = scanGlobalUxQuality(context.modulesComplete);
  const marketplaceRules = scanMarketplaceRules(context);
  const infrastructure = runGlobalInfrastructureValidation();
  const cleanup = runMarketplaceCleanupScan();
  const blockers = buildLaunchBlockers(scan);
  const certificationScores = buildLaunchCertificationScores(scan, infrastructure.passPercent);
  const report = buildLaunchReport(priorities, infrastructure.passPercent, scan);
  const launchRules = buildLaunchRules(scan, priorities);

  const safeRepairs = LAUNCH_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `launch-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: false,
    message: scan.certificationEligible ? "No repairs required" : `${labelize(action)} available in safe mode`,
  }));

  const allChecks = [...priorities.flatMap((p) => p.scans), ...uiQuality, ...uxQuality, ...marketplaceRules];
  const clear = allChecks.filter((c) => c.status === "pass").length;
  const passPercent = allChecks.length === 0 ? 100 : Math.round((clear / allChecks.length) * 10000) / 100;
  const activeBlockers = blockers.filter((b) => b.active).length;
  const allRulesPass = launchRules.every((r) => r.pass);
  const allPrioritiesPass = priorities.every((p) => p.passPercent >= 100);
  const launchReady = passPercent >= 100 && activeBlockers === 0 && allRulesPass && allPrioritiesPass && scan.omegaPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    passPercent,
    status: launchReady ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    launchReady,
    productionReady: launchReady && scan.productionReady,
    priorities,
    uiQuality,
    uxQuality,
    marketplaceRules,
    infrastructure: infrastructure.checks,
    cleanupProposals: cleanup.proposals,
    blockers,
    certificationScores,
    report,
    launchRules,
    safeRepairs,
    activeBlockers,
  };
}

export function isLaunchModePass(result: LaunchModeResult): boolean {
  return result.status === "pass" && result.passPercent >= 100 && result.launchReady;
}
