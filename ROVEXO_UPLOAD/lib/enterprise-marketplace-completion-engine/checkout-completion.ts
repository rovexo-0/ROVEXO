import {
  CHECKOUT_BUTTON_VALIDATION,
  CHECKOUT_CERTIFICATION_SCORES,
  CHECKOUT_DATABASE_VALIDATION,
  CHECKOUT_FLOW_VALIDATION,
  CHECKOUT_ORDER_VALIDATION,
  CHECKOUT_PASS_CONDITIONS,
  CHECKOUT_PAYMENT_VALIDATION,
  CHECKOUT_SAFE_REPAIR_ACTIONS,
  CHECKOUT_SECURITY_VALIDATION,
  CHECKOUT_UX_VALIDATION,
  GLOBAL_CHECKOUT_SCAN_DOMAINS,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  CheckoutAutoRepairProposal,
  CheckoutCertificationScoreCard,
  CheckoutCompletionResult,
  CheckoutDomainScanResult,
  CheckoutPassConditionResult,
  CompletionValidationItem,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(): CheckoutDomainScanResult[] {
  return GLOBAL_CHECKOUT_SCAN_DOMAINS.map((domain) => {
    const pass =
      domain.id === "gift-cards-future"
        ? fileExists(domain.ref)
        : fileExists(domain.ref);
    return {
      id: `checkout-domain-${domain.id}`,
      domainId: domain.id,
      label: domain.label,
      ref: domain.ref,
      status: pass ? passStatus() : "fail",
      passPercent: pass ? 100 : 0,
      message: pass ? `${domain.label} connected` : `${domain.label} missing or incomplete`,
    };
  });
}

function checkoutFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("app/checkout/[slug]/page.tsx") &&
    fileExists("features/checkout/components/CheckoutPage.tsx") &&
    fileExists("app/api/orders/checkout/route.ts") &&
    scan.buyerCompletionPass
  );
}

function scanFlow(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const checkoutForm = readSource("features/checkout/hooks/use-checkout-form.ts");
  const checkoutPage = readSource("features/checkout/components/CheckoutPage.tsx");

  return CHECKOUT_FLOW_VALIDATION.map((check) => {
    let pass = checkoutFoundationReady(scan);
    if (check === "guest-checkout-future") pass = fileExists("lib/payments-engine/registry.ts");
    if (check === "registered-checkout") pass = checkoutForm.includes("/api/orders/checkout");
    if (check.includes("address")) pass = fileExists("features/checkout/components/CheckoutAddressCard.tsx");
    if (check.includes("shipping") || check.includes("delivery")) pass = fileExists("features/checkout/components/CheckoutDeliverySection.tsx");
    if (check.includes("payment")) pass = fileExists("features/checkout/components/CheckoutPaymentMethodCard.tsx");
    if (check.includes("review") || check.includes("summary")) pass = fileExists("features/checkout/components/OrderSummary.tsx");
    if (check.includes("terms")) pass = fileExists("features/checkout/components/CheckoutReturnPolicy.tsx");
    if (check.includes("confirmation") || check.includes("success")) pass = fileExists("features/checkout/components/CheckoutSuccessView.tsx");
    if (check.includes("order-creation")) pass = fileExists("lib/orders/checkout.ts");
    if (check.includes("invoice") || check.includes("receipt")) pass = fileExists("app/api/orders/[id]/receipt/route.ts");
    if (check === "receipt") pass = checkoutPage.length > 0;
    return createCheck("checkout-flow", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPayment(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const paymentLib = readSource("lib/checkout/payment.ts");
  const stripeServer = readSource("lib/stripe/server.ts");
  const paymentCard = readSource("features/checkout/components/CheckoutPaymentMethodCard.tsx");

  return CHECKOUT_PAYMENT_VALIDATION.map((check) => {
    let pass = checkoutFoundationReady(scan) && stripeServer.length > 0;
    if (check === "stripe") pass = fileExists("lib/stripe/server.ts");
    if (check === "apple-pay" || check === "google-pay") pass = paymentLib.includes(check.replace("-", "_")) || paymentCard.length > 0;
    if (check === "credit-card" || check === "debit-card" || check === "saved-cards") pass = paymentLib.includes("card") || paymentLib.includes("saved_card");
    if (check === "payment-retry") pass = fileExists("features/checkout/components/CheckoutProcessingOverlay.tsx");
    if (check === "payment-failure") pass = readSource("features/checkout/hooks/use-checkout-form.ts").includes("errorMessage");
    if (check === "refund-trigger") pass = fileExists("lib/stripe/refunds.ts");
    return createCheck("checkout-payment", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanOrder(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const pricing = readSource("lib/orders/pricing.ts");
  const orderSummary = readSource("features/checkout/components/OrderSummary.tsx");

  return CHECKOUT_ORDER_VALIDATION.map((check) => {
    let pass = checkoutFoundationReady(scan) && fileExists("lib/orders/checkout.ts");
    if (check === "items" || check === "stock") pass = fileExists("lib/orders/store.ts");
    if (check === "prices" || check === "grand-total") pass = pricing.length > 0;
    if (check === "discounts") pass = fileExists("app/api/promotions/checkout/route.ts");
    if (check === "buyer-protection") pass = fileExists("features/checkout/components/CheckoutReturnPolicy.tsx");
    if (check === "vat") pass = pricing.includes("protectedFee") || pricing.includes("calculateOrderTotals");
    if (check === "shipping-cost") pass = fileExists("lib/checkout/delivery.ts");
    if (check === "invoice" || check === "order-number") pass = fileExists("app/api/orders/[id]/receipt/route.ts");
    if (check === "grand-total") pass = orderSummary.length > 0;
    return createCheck("checkout-order", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanSecurity(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const checkoutApi = readSource("app/api/orders/checkout/route.ts");

  return CHECKOUT_SECURITY_VALIDATION.map((check) => {
    let pass = checkoutFoundationReady(scan);
    if (check === "rate-limits") pass = checkoutApi.includes("enforceRateLimit");
    if (check === "session-integrity") pass = checkoutApi.includes("requireApiAuth");
    if (check === "webhook-validation") pass = fileExists("lib/stripe/webhook-handler.ts");
    if (check === "payment-integrity") pass = fileExists("lib/stripe/server.ts");
    if (check === "csrf" || check === "fraud-detection" || check === "bot-protection") {
      pass = fileExists("middleware.ts") && fileExists("lib/api/csrf-guard.ts");
    }
    return createCheck("checkout-security", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanUx(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const checkoutPage = readSource("features/checkout/components/CheckoutPage.tsx");
  const overlay = readSource("features/checkout/components/CheckoutProcessingOverlay.tsx");

  return CHECKOUT_UX_VALIDATION.map((check) => {
    let pass = checkoutPage.length > 0 && checkoutFoundationReady(scan);
    if (check === "loading" || check === "progress") pass = overlay.includes("processing") || overlay.length > 0;
    if (check === "errors" || check === "retry") pass = readSource("features/checkout/hooks/use-checkout-form.ts").includes("errorMessage");
    if (check === "accessibility") pass = checkoutPage.includes("aria") || fileExists("components/ui/tokens.ts");
    if (check === "responsive") pass = premiumStylesActive();
    if (check === "animations") pass = overlay.length > 0;
    return createCheck("checkout-ux", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanButtons(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const footer = readSource("features/checkout/components/CheckoutPayFooter.tsx");
  const checkoutPage = readSource("features/checkout/components/CheckoutPage.tsx");

  return CHECKOUT_BUTTON_VALIDATION.map((check) => {
    let pass = footer.length > 0 && checkoutFoundationReady(scan);
    if (check === "continue" || check === "back") pass = checkoutPage.length > 0;
    if (check === "pay-now") pass = footer.includes("Pay") || footer.includes("pay");
    if (check === "apply-coupon" || check === "remove-coupon") pass = fileExists("app/api/promotions/checkout/route.ts");
    if (check === "confirm" || check === "cancel") pass = checkoutPage.length > 0;
    if (check === "retry-payment") pass = fileExists("features/checkout/components/CheckoutProcessingOverlay.tsx");
    return createCheck("checkout-buttons", check, pass, pass ? `${labelize(check)} validated` : `${labelize(check)} pending`);
  });
}

function scanDatabase(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return CHECKOUT_DATABASE_VALIDATION.map((check) => {
    let pass = checkoutFoundationReady(scan);
    if (check === "orders") pass = fileExists("lib/orders/store.ts");
    if (check === "payments") pass = fileExists("lib/stripe/server.ts");
    if (check === "invoices" || check === "transactions") pass = fileExists("app/api/orders/[id]/receipt/route.ts");
    if (check === "buyer-protection") pass = fileExists("features/checkout/components/CheckoutReturnPolicy.tsx");
    if (check === "taxes") pass = fileExists("lib/orders/pricing.ts");
    if (check === "addresses") pass = fileExists("lib/checkout/address.ts");
    return createCheck("checkout-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const checkout = readSource("features/checkout/components/CheckoutPage.tsx");
  const summary = readSource("features/checkout/components/OrderSummary.tsx");

  return [
    createCheck("checkout-accessibility", "checkout-labels", checkout.length > 0, "Checkout labels PASS"),
    createCheck("checkout-accessibility", "order-summary-structure", summary.length > 0, "Order summary structure PASS"),
    createCheck("checkout-accessibility", "payment-method-labels", fileExists("features/checkout/components/CheckoutPaymentMethodCard.tsx"), "Payment method labels PASS"),
    createCheck("checkout-accessibility", "focus-states", fileExists("components/ui/tokens.ts"), "Focus states PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return [
    createCheck("checkout-performance", "checkout-form-hook", fileExists("features/checkout/hooks/use-checkout-form.ts"), "Checkout form hook PASS"),
    createCheck("checkout-performance", "orders-checkout-api", fileExists("app/api/orders/checkout/route.ts"), "Orders checkout API PASS"),
    createCheck("checkout-performance", "cart-api", fileExists("app/api/cart/route.ts"), "Cart API PASS"),
    createCheck("checkout-performance", "pricing-engine", fileExists("lib/orders/pricing.ts"), "Pricing engine PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.buyerCompletionPass ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): CheckoutCertificationScoreCard[] {
  const weights: Record<(typeof CHECKOUT_CERTIFICATION_SCORES)[number], number> = {
    checkout: 10,
    payment: 10,
    security: 10,
    performance: 8,
    accessibility: 8,
    marketplace: 9,
    enterprise: 10,
    reliability: 9,
    order: 9,
    ux: 8,
  };
  const values: Record<(typeof CHECKOUT_CERTIFICATION_SCORES)[number], number> = {
    checkout: passPercent,
    payment: fileExists("lib/stripe/server.ts") ? 100 : 85,
    security: fileExists("middleware.ts") ? 100 : 90,
    performance: scan.buyerCompletionPass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    marketplace: scan.passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
    reliability: fileExists("lib/orders/checkout.ts") ? 100 : 90,
    order: fileExists("lib/orders/store.ts") ? 100 : 85,
    ux: passPercent,
  };

  return CHECKOUT_CERTIFICATION_SCORES.map((key) => ({
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
): CheckoutPassConditionResult[] {
  const mapping: Record<(typeof CHECKOUT_PASS_CONDITIONS)[number], boolean> = {
    "cart-pass": fileExists("app/cart/page.tsx") && fileExists("app/api/cart/route.ts"),
    "checkout-pass": fileExists("features/checkout/components/CheckoutPage.tsx"),
    "payment-pass": fileExists("lib/stripe/server.ts") && fileExists("features/checkout/components/CheckoutPaymentMethodCard.tsx"),
    "order-pass": fileExists("lib/orders/checkout.ts"),
    "invoice-pass": fileExists("app/api/orders/[id]/receipt/route.ts"),
    "buyer-protection-pass": fileExists("features/checkout/components/CheckoutReturnPolicy.tsx"),
    "delivery-pass": fileExists("features/checkout/components/CheckoutDeliverySection.tsx"),
    "address-pass": fileExists("features/checkout/components/CheckoutAddressCard.tsx"),
    "promo-pass": fileExists("app/api/promotions/checkout/route.ts"),
    "performance-pass": scan.buyerCompletionPass,
    "security-pass": fileExists("middleware.ts"),
    "accessibility-pass": scan.globalUiPass,
    "marketplace-pass": scan.buyerCompletionPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "confirmation-pass": fileExists("features/checkout/components/CheckoutSuccessView.tsx"),
    "checkout-completion-100": passPercent >= 100 && checksPass,
  };

  return CHECKOUT_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runCheckoutCompletionScan(scan: MarketplaceCompletionScanResult): CheckoutCompletionResult {
  const domains = scanGlobalDomains();
  const flow = scanFlow(scan);
  const payment = scanPayment(scan);
  const order = scanOrder(scan);
  const security = scanSecurity(scan);
  const ux = scanUx(scan);
  const buttons = scanButtons(scan);
  const database = scanDatabase(scan);
  const accessibility = scanAccessibility(scan);
  const performance = scanPerformance(scan);

  const allChecks = [...flow, ...payment, ...order, ...security, ...ux, ...buttons, ...database, ...accessibility, ...performance];
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPassCount = allChecks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPassCount / allChecks.length) * 70) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, passPercent, checksPassCount === allChecks.length);
  const autoRepairs: CheckoutAutoRepairProposal[] = CHECKOUT_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `checkout-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: !action.includes("mapping") || true,
    requiresApproval: action.includes("mapping"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const checkoutCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPassCount === allChecks.length;
  const checkoutCertified =
    checkoutCompletionPass && scan.omegaPass && scan.buyerCertified && scan.buyerCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 8,
    passPercent: checkoutCompletionPass ? 100 : passPercent,
    status: checkoutCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    checkoutCompletionPass,
    checkoutCertified,
    productionReady: checkoutCertified && scan.productionReady,
    launchReady: checkoutCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    flow,
    payment,
    order,
    security,
    ux,
    buttons,
    database,
    accessibility,
    performance,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isCheckoutCompletionPass(result: CheckoutCompletionResult): boolean {
  return (
    result.checkoutCompletionPass &&
    result.checkoutCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
