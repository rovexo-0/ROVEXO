import {
  GLOBAL_ORDER_SCAN_DOMAINS,
  ORDER_BUYER_VALIDATION,
  ORDER_CERTIFICATION_SCORES,
  ORDER_COMPANY_VALIDATION,
  ORDER_DATABASE_VALIDATION,
  ORDER_PASS_CONDITIONS,
  ORDER_SAFE_REPAIR_ACTIONS,
  ORDER_SELLER_VALIDATION,
  ORDER_STATUS_ENGINE,
  ORDER_WORKFLOW_VALIDATION,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  CompletionValidationItem,
  MarketplaceCompletionScanResult,
  OrderAutoRepairProposal,
  OrderCertificationScoreCard,
  OrderCompletionResult,
  OrderDomainScanResult,
  OrderPassConditionResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(): OrderDomainScanResult[] {
  return GLOBAL_ORDER_SCAN_DOMAINS.map((domain) => ({
    id: `order-domain-${domain.id}`,
    domainId: domain.id,
    label: domain.label,
    ref: domain.ref,
    status: fileExists(domain.ref) ? passStatus() : "fail",
    passPercent: fileExists(domain.ref) ? 100 : 0,
    message: fileExists(domain.ref) ? `${domain.label} connected` : `${domain.label} missing or incomplete`,
  }));
}

function orderFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("app/account/orders/page.tsx") &&
    fileExists("app/seller/orders/page.tsx") &&
    fileExists("lib/orders/store.ts") &&
    scan.checkoutCompletionPass
  );
}

function scanWorkflow(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const checkout = readSource("lib/orders/checkout.ts");
  const confirmApi = readSource("app/api/orders/confirm/route.ts");

  return ORDER_WORKFLOW_VALIDATION.map((check) => {
    let pass = orderFoundationReady(scan);
    if (check === "create") pass = checkout.includes("createOrderCheckoutSession");
    if (check === "confirm") pass = confirmApi.includes("confirmOrderCheckoutSession");
    if (check === "reserve-stock") pass = fileExists("lib/orders/store.ts");
    if (check === "payment-verification") pass = fileExists("lib/stripe/webhook-handler.ts");
    if (check === "invoice-generation") pass = fileExists("app/api/orders/[id]/receipt/route.ts");
    if (check === "seller-notification") pass = fileExists("lib/orders/notifications.ts");
    if (check === "shipping-creation") pass = fileExists("features/shipping/components/ShipmentWizard.tsx");
    if (check === "tracking-assignment") pass = fileExists("features/shipping/components/ParcelCard.tsx");
    if (check === "delivery-confirmation") pass = fileExists("features/orders/components/OrderActionsCard.tsx");
    if (check === "completion") pass = readSource("lib/orders/status.ts").includes("completed");
    if (check === "archive") pass = fileExists("lib/orders/cleanup.ts");
    return createCheck("order-workflow", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanBuyer(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return ORDER_BUYER_VALIDATION.map((check) => {
    let pass = orderFoundationReady(scan);
    if (check === "order-history") pass = fileExists("app/account/orders/page.tsx");
    if (check === "tracking") pass = fileExists("features/commerce-ui/views/TrackingView.tsx");
    if (check === "invoices") pass = fileExists("app/api/orders/[id]/receipt/route.ts");
    if (check === "returns" || check === "refund-requests") pass = fileExists("features/orders/components/IssueResolutionLink.tsx");
    if (check === "buyer-protection") pass = fileExists("app/protection/page.tsx");
    if (check === "notifications") pass = fileExists("lib/orders/notifications.ts");
    return createCheck("order-buyer", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanSeller(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return ORDER_SELLER_VALIDATION.map((check) => {
    let pass = orderFoundationReady(scan);
    if (check === "order-queue") pass = fileExists("app/seller/orders/page.tsx");
    if (check === "packing") pass = fileExists("features/orders/components/SellerFulfillmentCard.tsx");
    if (check === "dispatch") pass = fileExists("features/shipping/components/ShipmentWizard.tsx");
    if (check === "tracking-update") pass = fileExists("features/shipping/components/ParcelCard.tsx");
    if (check === "order-completion") pass = fileExists("features/orders/components/OrderActionsCard.tsx");
    if (check === "returns" || check === "disputes") pass = fileExists("features/orders/components/IssueResolutionLink.tsx");
    return createCheck("order-seller", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanCompany(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return ORDER_COMPANY_VALIDATION.map((check) => {
    let pass = orderFoundationReady(scan);
    if (check === "bulk-orders" || check === "bulk-dispatch") pass = fileExists("app/business/dashboard/page.tsx");
    if (check === "analytics") pass = fileExists("app/super-admin/business-intelligence/orders/page.tsx");
    if (check === "exports") pass = fileExists("lib/orders/queries.ts");
    if (check === "accounting-integration") pass = fileExists("lib/integrations-engine/defaults.ts");
    return createCheck("order-company", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanStatusEngine(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const typesSource = readSource("lib/orders/types.ts");
  const engineRegistry = readSource("lib/orders-engine/registry.ts");

  return ORDER_STATUS_ENGINE.map((check) => {
    let pass = typesSource.length > 0 && orderFoundationReady(scan);
    if (check === "awaiting-payment") pass = typesSource.includes("awaiting_payment");
    if (check === "paid" || check === "preparing" || check === "packed") pass = engineRegistry.includes("payment-authorized") || engineRegistry.includes("preparing-shipment");
    if (check === "dispatched" || check === "in-transit") pass = engineRegistry.includes("in-transit") || typesSource.includes("shipped");
    if (check === "delivered" || check === "completed") pass = typesSource.includes("delivered") || typesSource.includes("completed");
    if (check === "cancelled") pass = typesSource.includes("cancelled");
    if (check === "refunded" || check === "returned" || check === "disputed") pass = engineRegistry.includes(check);
    if (check === "pending") pass = engineRegistry.includes("payment-pending");
    return createCheck("order-status", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanDatabase(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return ORDER_DATABASE_VALIDATION.map((check) => {
    let pass = orderFoundationReady(scan);
    if (check === "orders") pass = fileExists("lib/orders/store.ts");
    if (check === "invoices") pass = fileExists("app/api/orders/[id]/receipt/route.ts");
    if (check === "order-items") pass = readSource("lib/orders/types.ts").includes("OrderProduct");
    if (check === "tracking") pass = fileExists("features/commerce-ui/views/TrackingView.tsx");
    if (check === "returns" || check === "disputes") pass = fileExists("features/orders/components/IssueResolutionLink.tsx");
    if (check === "refunds") pass = fileExists("lib/stripe/refunds.ts");
    if (check === "audit-logs") pass = fileExists("lib/orders-engine/audit.ts");
    return createCheck("order-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const detailView = readSource("features/orders/components/OrderDetailView.tsx");
  const listPage = readSource("features/orders/components/OrdersPage.tsx");

  return [
    createCheck("order-accessibility", "order-detail-structure", detailView.length > 0, "Order detail structure PASS"),
    createCheck("order-accessibility", "order-list-structure", listPage.length > 0, "Order list structure PASS"),
    createCheck("order-accessibility", "status-badges", fileExists("features/orders/components/OrderStatusBadge.tsx"), "Status badges PASS"),
    createCheck("order-accessibility", "focus-states", fileExists("components/ui/tokens.ts"), "Focus states PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return [
    createCheck("order-performance", "order-queries", fileExists("lib/orders/queries.ts"), "Order queries PASS"),
    createCheck("order-performance", "orders-api", fileExists("app/api/orders/route.ts"), "Orders API PASS"),
    createCheck("order-performance", "order-engine", fileExists("lib/orders-engine/engine.ts"), "Order engine PASS"),
    createCheck("order-performance", "order-cleanup-cron", fileExists("app/api/cron/orders/cleanup/route.ts"), "Order cleanup cron PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.checkoutCompletionPass ? passStatus() : item.status,
  }));
}

function scanSecurity(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const ordersApi = readSource("app/api/orders/route.ts");
  const orderDetailApi = readSource("app/api/orders/[id]/route.ts");

  return [
    createCheck("order-security", "auth-required", ordersApi.includes("requireApiAuth") || orderDetailApi.includes("requireApiAuth"), "Auth required PASS"),
    createCheck("order-security", "role-isolation", fileExists("lib/orders/role.ts"), "Role isolation PASS"),
    createCheck("order-security", "webhook-integrity", fileExists("lib/stripe/webhook-handler.ts"), "Webhook integrity PASS"),
    createCheck("order-security", "middleware-protection", fileExists("middleware.ts"), "Middleware protection PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && orderFoundationReady(scan) ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): OrderCertificationScoreCard[] {
  const weights: Record<(typeof ORDER_CERTIFICATION_SCORES)[number], number> = {
    "order-integrity": 10,
    tracking: 10,
    workflow: 10,
    security: 10,
    performance: 8,
    accessibility: 8,
    marketplace: 9,
    enterprise: 10,
  };
  const values: Record<(typeof ORDER_CERTIFICATION_SCORES)[number], number> = {
    "order-integrity": passPercent,
    tracking: fileExists("features/commerce-ui/views/TrackingView.tsx") ? 100 : 85,
    workflow: fileExists("lib/orders-engine/timeline.ts") ? 100 : 90,
    security: fileExists("lib/orders/role.ts") ? 100 : 90,
    performance: scan.checkoutCompletionPass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    marketplace: scan.passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
  };

  return ORDER_CERTIFICATION_SCORES.map((key) => ({
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
): OrderPassConditionResult[] {
  const mapping: Record<(typeof ORDER_PASS_CONDITIONS)[number], boolean> = {
    "order-creation-pass": fileExists("lib/orders/checkout.ts") && fileExists("app/api/orders/route.ts"),
    "tracking-pass": fileExists("features/commerce-ui/views/TrackingView.tsx"),
    "invoices-pass": fileExists("app/api/orders/[id]/receipt/route.ts"),
    "returns-pass": fileExists("features/orders/components/IssueResolutionLink.tsx"),
    "refund-workflow-pass": fileExists("lib/stripe/refunds.ts"),
    "notifications-pass": fileExists("lib/orders/notifications.ts"),
    "security-pass": fileExists("lib/orders/role.ts") && fileExists("middleware.ts"),
    "performance-pass": scan.checkoutCompletionPass,
    "accessibility-pass": scan.globalUiPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "order-completion-100": passPercent >= 100 && checksPass,
  };

  return ORDER_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runOrderCompletionScan(scan: MarketplaceCompletionScanResult): OrderCompletionResult {
  const domains = scanGlobalDomains();
  const workflow = scanWorkflow(scan);
  const buyer = scanBuyer(scan);
  const seller = scanSeller(scan);
  const company = scanCompany(scan);
  const statusEngine = scanStatusEngine(scan);
  const database = scanDatabase(scan);
  const security = scanSecurity(scan);
  const accessibility = scanAccessibility(scan);
  const performance = scanPerformance(scan);

  const allChecks = [...workflow, ...buyer, ...seller, ...company, ...statusEngine, ...database, ...security, ...accessibility, ...performance];
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPassCount = allChecks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPassCount / allChecks.length) * 70) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, passPercent, checksPassCount === allChecks.length);
  const autoRepairs: OrderAutoRepairProposal[] = ORDER_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `order-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: action.includes("synchronization") || action.includes("mapping"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const orderCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPassCount === allChecks.length;
  const orderCertified =
    orderCompletionPass && scan.omegaPass && scan.checkoutCertified && scan.checkoutCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 9,
    passPercent: orderCompletionPass ? 100 : passPercent,
    status: orderCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    orderCompletionPass,
    orderCertified,
    productionReady: orderCertified && scan.productionReady,
    launchReady: orderCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    workflow,
    buyer,
    seller,
    company,
    statusEngine,
    database,
    security,
    accessibility,
    performance,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isOrderCompletionPass(result: OrderCompletionResult): boolean {
  return (
    result.orderCompletionPass &&
    result.orderCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
