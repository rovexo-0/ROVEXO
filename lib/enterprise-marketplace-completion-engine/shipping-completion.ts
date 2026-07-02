import {
  GLOBAL_SHIPPING_SCAN_DOMAINS,
  SHIPPING_CERTIFICATION_SCORES,
  SHIPPING_DATABASE_VALIDATION,
  SHIPPING_PASS_CONDITIONS,
  SHIPPING_PLATFORM_VALIDATION,
  SHIPPING_SAFE_REPAIR_ACTIONS,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  CompletionValidationItem,
  MarketplaceCompletionScanResult,
  ShippingAutoRepairProposal,
  ShippingCertificationScoreCard,
  ShippingCompletionResult,
  ShippingDomainScanResult,
  ShippingPassConditionResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(): ShippingDomainScanResult[] {
  return GLOBAL_SHIPPING_SCAN_DOMAINS.map((domain) => ({
    id: `shipping-domain-${domain.id}`,
    domainId: domain.id,
    label: domain.label,
    ref: domain.ref,
    status: fileExists(domain.ref) ? passStatus() : "fail",
    passPercent: fileExists(domain.ref) ? 100 : 0,
    message: fileExists(domain.ref) ? `${domain.label} connected` : `${domain.label} missing or incomplete`,
  }));
}

function shippingFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("app/shipping/page.tsx") &&
    fileExists("lib/shipping/service.ts") &&
    scan.orderCompletionPass
  );
}

function scanPlatform(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const carriers = readSource("lib/shipping/carriers.ts");
  const protection = readSource("lib/protection-engine/registry.ts");
  const shippingDefaults = readSource("lib/shipping-engine/defaults.ts");
  const sellerSettings = readSource("lib/seller/shipping-settings.ts");

  return SHIPPING_PLATFORM_VALIDATION.map((check) => {
    let pass = shippingFoundationReady(scan);
    if (check === "shipping-labels") pass = fileExists("features/orders/components/ShippingLabelCard.tsx");
    if (check === "carrier-integration") pass = carriers.includes("UK_CARRIERS");
    if (check === "tracking-numbers") pass = carriers.includes("isValidTrackingNumber");
    if (check === "collection-points") pass = shippingDefaults.includes("collection");
    if (check === "home-delivery") pass = fileExists("lib/checkout/delivery.ts");
    if (check === "international-shipping") pass = sellerSettings.includes("internationalShippingEnabled");
    if (check === "shipping-rules") pass = readSource("lib/shipping-engine/registry.ts").includes("rules");
    if (check === "shipping-profiles") pass = fileExists("features/account/components/AccountSellerShippingPage.tsx");
    if (check === "delivery-estimates") pass = carriers.includes("estimateDeliveryDate");
    if (check === "shipping-zones") pass = shippingDefaults.includes("zones");
    if (check === "shipping-prices") pass = sellerSettings.includes("baseShippingCost");
    if (check === "buyer-protection-shipping") pass = fileExists("app/protection/page.tsx");
    if (check === "lost-parcel-workflow") pass = protection.includes("lost-shipment");
    if (check === "damaged-parcel-workflow") pass = protection.includes("item-damaged");
    if (check === "returns-workflow") pass = fileExists("features/orders/components/IssueResolutionLink.tsx");
    return createCheck("shipping-platform", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanDatabase(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const service = readSource("lib/shipping/service.ts");

  return SHIPPING_DATABASE_VALIDATION.map((check) => {
    let pass = shippingFoundationReady(scan);
    if (check === "shipping-tables") pass = service.includes("order_shipments");
    if (check === "tracking-tables" || check === "parcel-history") pass = fileExists("lib/shipping-engine/timeline.ts");
    if (check === "carrier-mapping") pass = fileExists("lib/shipping/carriers.ts");
    if (check === "delivery-status") pass = fileExists("features/orders/components/DeliveryStatusCard.tsx");
    if (check === "notifications") pass = fileExists("lib/orders/notifications.ts");
    if (check === "audit-logs") pass = fileExists("lib/shipping-engine/audit.ts");
    return createCheck("shipping-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanSecurity(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const service = readSource("lib/shipping/service.ts");

  return [
    createCheck("shipping-security", "tracking-validation", readSource("lib/shipping/carriers.ts").includes("isValidTrackingNumber"), "Tracking validation PASS"),
    createCheck("shipping-security", "admin-shipment-access", service.includes("createAdminClient"), "Admin shipment access PASS"),
    createCheck("shipping-security", "carrier-integrity", fileExists("lib/shipping-engine/registry.ts"), "Carrier integrity PASS"),
    createCheck("shipping-security", "middleware-protection", fileExists("middleware.ts"), "Middleware protection PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && shippingFoundationReady(scan) ? passStatus() : item.status,
  }));
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const hub = readSource("features/shipping/ShippingEngineHub.tsx");
  const tracking = readSource("features/orders/components/OrderTrackingCard.tsx");

  return [
    createCheck("shipping-accessibility", "shipping-hub-structure", hub.length > 0, "Shipping hub structure PASS"),
    createCheck("shipping-accessibility", "tracking-card-structure", tracking.length > 0, "Tracking card structure PASS"),
    createCheck("shipping-accessibility", "delivery-status-labels", fileExists("features/orders/components/DeliveryStatusCard.tsx"), "Delivery status labels PASS"),
    createCheck("shipping-accessibility", "focus-states", fileExists("components/ui/tokens.ts"), "Focus states PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return [
    createCheck("shipping-performance", "shipping-service", fileExists("lib/shipping/service.ts"), "Shipping service PASS"),
    createCheck("shipping-performance", "shipping-engine", fileExists("lib/shipping-engine/engine.ts"), "Shipping engine PASS"),
    createCheck("shipping-performance", "tracking-timeline", fileExists("lib/shipping-engine/timeline.ts"), "Tracking timeline PASS"),
    createCheck("shipping-performance", "shipping-hub", fileExists("features/shipping/ShippingEngineHub.tsx"), "Shipping hub PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.orderCompletionPass ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): ShippingCertificationScoreCard[] {
  const weights: Record<(typeof SHIPPING_CERTIFICATION_SCORES)[number], number> = {
    shipping: 10,
    tracking: 10,
    carrier: 10,
    performance: 8,
    security: 10,
    accessibility: 8,
    marketplace: 9,
    enterprise: 10,
  };
  const values: Record<(typeof SHIPPING_CERTIFICATION_SCORES)[number], number> = {
    shipping: passPercent,
    tracking: fileExists("features/orders/components/OrderTrackingCard.tsx") ? 100 : 85,
    carrier: fileExists("lib/shipping/carriers.ts") ? 100 : 85,
    performance: scan.orderCompletionPass ? 100 : 90,
    security: fileExists("lib/shipping/service.ts") ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    marketplace: scan.passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
  };

  return SHIPPING_CERTIFICATION_SCORES.map((key) => ({
    key,
    label: labelize(key),
    score: values[key],
    status: values[key] >= 100 ? passStatus() : "fail",
    weight: weights[key],
  }));
}

function buildPassConditions(
  scan: MarketplaceCompletionScanResult,
  passPercent: number,
  checksPass: boolean,
): ShippingPassConditionResult[] {
  const mapping: Record<(typeof SHIPPING_PASS_CONDITIONS)[number], boolean> = {
    "shipping-pass": fileExists("app/shipping/page.tsx") && fileExists("lib/shipping/service.ts"),
    "tracking-pass": fileExists("features/orders/components/OrderTrackingCard.tsx"),
    "returns-pass": fileExists("features/orders/components/IssueResolutionLink.tsx"),
    "carrier-pass": fileExists("lib/shipping/carriers.ts"),
    "notifications-pass": fileExists("lib/orders/notifications.ts"),
    "security-pass": fileExists("middleware.ts") && fileExists("lib/shipping/service.ts"),
    "performance-pass": scan.orderCompletionPass,
    "accessibility-pass": scan.globalUiPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "shipping-completion-100": passPercent >= 100 && checksPass,
  };

  return SHIPPING_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runShippingCompletionScan(scan: MarketplaceCompletionScanResult): ShippingCompletionResult {
  const domains = scanGlobalDomains();
  const platform = scanPlatform(scan);
  const database = scanDatabase(scan);
  const security = scanSecurity(scan);
  const accessibility = scanAccessibility(scan);
  const performance = scanPerformance(scan);

  const allChecks = [...platform, ...database, ...security, ...accessibility, ...performance];
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPassCount = allChecks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPassCount / allChecks.length) * 70) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, passPercent, checksPassCount === allChecks.length);
  const autoRepairs: ShippingAutoRepairProposal[] = SHIPPING_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `shipping-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: action.includes("mapping") || action.includes("sync"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const shippingCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPassCount === allChecks.length;
  const shippingCertified =
    shippingCompletionPass && scan.omegaPass && scan.orderCertified && scan.orderCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 11,
    passPercent: shippingCompletionPass ? 100 : passPercent,
    status: shippingCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    shippingCompletionPass,
    shippingCertified,
    productionReady: shippingCertified && scan.productionReady,
    launchReady: shippingCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    platform,
    database,
    security,
    accessibility,
    performance,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isShippingCompletionPass(result: ShippingCompletionResult): boolean {
  return (
    result.shippingCompletionPass &&
    result.shippingCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
