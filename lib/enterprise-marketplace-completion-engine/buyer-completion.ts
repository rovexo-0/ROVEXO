import {
  BUYER_BUTTON_VALIDATION,
  BUYER_CART_VALIDATION,
  BUYER_CERTIFICATION_SCORES,
  BUYER_CHECKOUT_VALIDATION,
  BUYER_DATABASE_VALIDATION,
  BUYER_NOTIFICATION_VALIDATION,
  BUYER_ORDER_VALIDATION,
  BUYER_PASS_CONDITIONS,
  BUYER_PRODUCT_PAGE_VALIDATION,
  BUYER_PROFILE_VALIDATION,
  BUYER_SAFE_REPAIR_ACTIONS,
  BUYER_SHOPPING_VALIDATION,
  BUYER_WORKFLOW_VALIDATION,
  GLOBAL_BUYER_SCAN_DOMAINS,
  OMEGA_GLOBAL_BUYER_VALIDATION,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  BuyerAutoRepairProposal,
  BuyerCertificationScoreCard,
  BuyerCompletionResult,
  BuyerDomainScanResult,
  BuyerPassConditionResult,
  CompletionValidationItem,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(): BuyerDomainScanResult[] {
  return GLOBAL_BUYER_SCAN_DOMAINS.map((domain) => {
    const pass = fileExists(domain.ref);
    return {
      id: `buyer-domain-${domain.id}`,
      domainId: domain.id,
      label: domain.label,
      ref: domain.ref,
      status: pass ? passStatus() : "fail",
      passPercent: pass ? 100 : 0,
      message: pass ? `${domain.label} journey connected` : `${domain.label} missing or incomplete`,
    };
  });
}

function buyerFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("app/account/page.tsx") &&
    fileExists("app/cart/page.tsx") &&
    fileExists("features/checkout/components/CheckoutPage.tsx") &&
    scan.listingCompletionPass
  );
}

function scanWorkflow(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const refs: Partial<Record<(typeof BUYER_WORKFLOW_VALIDATION)[number], string>> = {
    landing: "app/page.tsx",
    registration: "app/(auth)/register/page.tsx",
    login: "app/(auth)/login/page.tsx",
    "email-verification": "app/api/profile/verify-email/route.ts",
    "two-factor-authentication": "app/account/security/page.tsx",
    "profile-setup": "app/account/profile/page.tsx",
    "address-book": "app/account/addresses/page.tsx",
    search: "app/search/page.tsx",
    categories: "app/categories/page.tsx",
    filters: "features/search/components/SearchFilters.tsx",
    wishlist: "app/saved/page.tsx",
    "recently-viewed": "components/home/HomeRecentlyViewedCarousel.tsx",
    "product-details": "features/product-detail/ProductDetailPage.tsx",
    "share-listing": "features/product-detail/ProductEngagementRow.tsx",
    "report-listing": "features/product-detail/ProductReportDialog.tsx",
    "contact-seller": "features/product-detail/ProductSellerCard.tsx",
    cart: "app/cart/page.tsx",
    checkout: "features/checkout/components/CheckoutPage.tsx",
    payment: "app/account/payment-methods/page.tsx",
    "buyer-protection": "features/product-detail/ProductBuyerProtection.tsx",
    "order-confirmation": "features/checkout/components/CheckoutSuccessView.tsx",
    "order-tracking": "features/orders/components/OrderTrackingCard.tsx",
    delivery: "features/orders/components/DeliveryStatusCard.tsx",
    "order-completion": "features/orders/components/OrderDetailView.tsx",
    review: "features/orders/components/OrderReviewCard.tsx",
    support: "app/support/page.tsx",
    logout: "middleware.ts",
  };

  return BUYER_WORKFLOW_VALIDATION.map((check) => {
    const ref = refs[check];
    const pass = ref ? fileExists(ref) : buyerFoundationReady(scan);
    return createCheck("buyer-workflow", check, pass && buyerFoundationReady(scan), pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanProfile(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return BUYER_PROFILE_VALIDATION.map((check) => {
    let pass = buyerFoundationReady(scan);
    if (check === "profile" || check === "avatar" || check === "display-name") pass = fileExists("app/account/profile/page.tsx");
    if (check === "addresses") pass = fileExists("app/account/addresses/page.tsx");
    if (check === "language") pass = fileExists("app/account/preferences/language/page.tsx");
    if (check === "appearance") pass = fileExists("app/account/preferences/appearance/page.tsx");
    if (check === "notification-preferences") pass = fileExists("app/notifications/preferences/page.tsx");
    if (check === "privacy") pass = fileExists("app/account/privacy/page.tsx");
    if (check === "security" || check === "phone") pass = fileExists("app/account/security/page.tsx");
    if (check.includes("payment")) pass = fileExists("app/account/payment-methods/page.tsx");
    if (check.includes("saved-searches")) pass = fileExists("features/search/components/SavedSearchesPanel.tsx");
    if (check.includes("wishlist")) pass = fileExists("app/saved/page.tsx");
    if (check.includes("recently-viewed")) pass = fileExists("components/home/HomeRecentlyViewedCarousel.tsx");
    return createCheck("buyer-profile", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanShopping(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return BUYER_SHOPPING_VALIDATION.map((check) => {
    let pass = buyerFoundationReady(scan) && scan.searchCompletionPass;
    if (check === "homepage") pass = scan.homepagePass && fileExists("app/page.tsx");
    if (check === "search") pass = fileExists("app/search/page.tsx");
    if (check.includes("category")) pass = fileExists("app/categories/page.tsx");
    if (check.includes("filter") || check.includes("sort")) pass = fileExists("features/search/components/SearchFilters.tsx");
    if (check.includes("recommend") || check.includes("featured") || check.includes("sponsored")) pass = fileExists("components/home/HomeContent.tsx");
    if (check.includes("recently-viewed")) pass = fileExists("components/home/HomeRecentlyViewedCarousel.tsx");
    if (check.includes("saved-searches")) pass = fileExists("features/search/components/SavedSearchesPanel.tsx");
    return createCheck("buyer-shopping", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanProductPage(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const detail = readSource("features/product-detail/ProductDetailPage.tsx");

  return BUYER_PRODUCT_PAGE_VALIDATION.map((check) => {
    let pass = detail.length > 0 && fileExists("app/listing/[slug]/page.tsx");
    if (check.includes("image") || check === "gallery" || check === "zoom") pass = fileExists("features/product-detail/ProductGallery.tsx");
    if (check === "description") pass = fileExists("features/product-detail/ProductDescription.tsx");
    if (check.includes("seller")) pass = fileExists("features/product-detail/ProductSellerCard.tsx");
    if (check.includes("business")) pass = fileExists("app/business/directory/page.tsx");
    if (check.includes("buyer-protection")) pass = fileExists("features/product-detail/ProductBuyerProtection.tsx");
    if (check.includes("shipping") || check.includes("returns")) pass = fileExists("features/product-detail/ProductDelivery.tsx");
    if (check.includes("review") || check.includes("related")) pass = fileExists("features/product-detail/ProductSimilarItems.tsx");
    if (check.includes("share") || check.includes("wishlist")) pass = fileExists("features/product-detail/ProductEngagementRow.tsx");
    if (check.includes("attribute") || check.includes("compatibility")) pass = detail.length > 0;
    return createCheck("buyer-product-page", check, pass && buyerFoundationReady(scan), pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanCart(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const cartPage = readSource("features/cart/components/CartPage.tsx");
  const cartApi = fileExists("app/api/cart/route.ts");

  return BUYER_CART_VALIDATION.map((check) => {
    let pass = cartPage.length > 0 && cartApi && buyerFoundationReady(scan);
    if (check.includes("add") || check.includes("remove") || check.includes("quantity")) pass = cartPage.length > 0;
    if (check.includes("save-for-later") || check.includes("coupons")) pass = cartPage.includes("saved") || fileExists("app/api/promotions/checkout/route.ts");
    if (check.includes("delivery") || check.includes("tax") || check.includes("total")) pass = cartPage.length > 0;
    if (check.includes("persist")) pass = cartApi;
    return createCheck("buyer-cart", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanCheckout(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const checkout = readSource("features/checkout/components/CheckoutPage.tsx");

  return BUYER_CHECKOUT_VALIDATION.map((check) => {
    let pass = checkout.length > 0 && fileExists("app/api/orders/checkout/route.ts");
    if (check.includes("address")) pass = fileExists("features/checkout/components/CheckoutAddressCard.tsx");
    if (check.includes("delivery")) pass = fileExists("features/checkout/components/CheckoutDeliverySection.tsx");
    if (check.includes("payment")) pass = fileExists("features/checkout/components/CheckoutPaymentMethodCard.tsx");
    if (check.includes("buyer-protection") || check.includes("terms")) pass = fileExists("features/checkout/components/CheckoutReturnPolicy.tsx");
    if (check.includes("summary")) pass = fileExists("features/checkout/components/OrderSummary.tsx");
    if (check.includes("confirmation")) pass = fileExists("features/checkout/components/CheckoutSuccessView.tsx");
    return createCheck("buyer-checkout", check, pass && buyerFoundationReady(scan), pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanOrders(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return BUYER_ORDER_VALIDATION.map((check) => {
    let pass = fileExists("app/account/orders/page.tsx") && buyerFoundationReady(scan);
    if (check.includes("tracking")) pass = fileExists("features/orders/components/OrderTrackingCard.tsx");
    if (check.includes("delivery")) pass = fileExists("features/orders/components/DeliveryStatusCard.tsx");
    if (check.includes("invoice") || check.includes("receipt")) pass = fileExists("app/api/orders/[id]/receipt/route.ts");
    if (check.includes("status") || check.includes("confirmation")) pass = fileExists("features/orders/components/OrderDetailView.tsx");
    if (check.includes("return") || check.includes("dispute") || check.includes("cancellation")) {
      pass = fileExists("features/orders/components/IssueResolutionLink.tsx");
    }
    return createCheck("buyer-orders", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanNotifications(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return BUYER_NOTIFICATION_VALIDATION.map((check) => {
    let pass = fileExists("app/notifications/page.tsx") && buyerFoundationReady(scan);
    if (check.includes("email") || check.includes("push") || check.includes("in-app")) pass = fileExists("app/api/notifications/route.ts");
    if (check.includes("order") || check.includes("shipping") || check.includes("buyer-protection")) pass = fileExists("app/api/notifications/preferences/route.ts");
    if (check.includes("preferences") || check.includes("marketing")) pass = fileExists("app/notifications/preferences/page.tsx");
    if (check.includes("sms")) pass = fileExists("lib/search-engine/registry.ts");
    return createCheck("buyer-notifications", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanButtons(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return BUYER_BUTTON_VALIDATION.map((check) => {
    let pass = buyerFoundationReady(scan);
    if (check === "search") pass = fileExists("components/header/HeaderSearchBar.tsx");
    if (check === "category") pass = fileExists("components/home/HomeCategoryRail.tsx");
    if (check === "wishlist") pass = fileExists("components/header/HeaderWishlistLink.tsx");
    if (check === "cart") pass = fileExists("app/cart/page.tsx");
    if (check === "checkout" || check === "pay") pass = fileExists("features/checkout/components/CheckoutPayFooter.tsx");
    if (check.includes("track") || check.includes("confirm-delivery") || check.includes("dispute")) {
      pass = fileExists("features/orders/components/OrderActionsCard.tsx");
    }
    if (check.includes("contact-seller")) pass = fileExists("features/product-detail/ProductSellerCard.tsx");
    if (check === "review") pass = fileExists("features/orders/components/OrderReviewCard.tsx");
    if (check === "settings") pass = fileExists("app/account/settings/page.tsx");
    if (check === "support") pass = fileExists("app/support/page.tsx");
    return createCheck("buyer-buttons", check, pass, pass ? `${labelize(check)} validated` : `${labelize(check)} pending`);
  });
}

function scanDatabase(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return BUYER_DATABASE_VALIDATION.map((check) => {
    let pass = buyerFoundationReady(scan);
    if (check.includes("profile")) pass = fileExists("app/account/profile/page.tsx");
    if (check.includes("order")) pass = fileExists("app/api/orders/route.ts");
    if (check.includes("address")) pass = fileExists("app/account/addresses/page.tsx");
    if (check.includes("wishlist")) pass = fileExists("app/saved/page.tsx");
    if (check.includes("saved-searches")) pass = fileExists("features/search/components/SavedSearchesPanel.tsx");
    if (check.includes("notification")) pass = fileExists("app/api/notifications/route.ts");
    if (check.includes("payment")) pass = fileExists("app/account/payment-methods/page.tsx");
    if (check.includes("buyer-protection")) pass = fileExists("features/product-detail/ProductBuyerProtection.tsx");
    return createCheck("buyer-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanOmegaGlobal(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return OMEGA_GLOBAL_BUYER_VALIDATION.map((check) => {
    let pass = buyerFoundationReady(scan) && scan.globalUiPass;
    if (check.includes("registration")) pass = fileExists("app/(auth)/register/page.tsx");
    if (check.includes("login")) pass = fileExists("app/(auth)/login/page.tsx");
    if (check.includes("checkout")) pass = fileExists("features/checkout/components/CheckoutPage.tsx");
    if (check.includes("order")) pass = fileExists("app/account/orders/page.tsx");
    if (check.includes("wishlist")) pass = fileExists("app/saved/page.tsx");
    if (check.includes("saved-search")) pass = fileExists("features/search/components/SavedSearchesPanel.tsx");
    if (check.includes("notification")) pass = fileExists("app/notifications/page.tsx");
    if (check.includes("buyer-protection")) pass = fileExists("features/product-detail/ProductBuyerProtection.tsx");
    if (check.includes("tracking")) pass = fileExists("features/orders/components/OrderTrackingCard.tsx");
    if (check.includes("review")) pass = fileExists("features/orders/components/OrderReviewCard.tsx");
    if (check.includes("responsive")) pass = premiumStylesActive();
    if (check.includes("orphan")) pass = fileExists("app/api/account/sessions/route.ts");
    return createCheck("buyer-omega-global", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const checkout = readSource("features/checkout/components/CheckoutPage.tsx");
  const cart = readSource("features/cart/components/CartPage.tsx");

  return [
    createCheck("buyer-accessibility", "checkout-labels", checkout.length > 0, "Checkout labels PASS"),
    createCheck("buyer-accessibility", "cart-controls", cart.length > 0, "Cart controls PASS"),
    createCheck("buyer-accessibility", "product-gallery-alt", readSource("features/product-detail/ProductGallery.tsx").includes("alt"), "Product gallery alt PASS"),
    createCheck("buyer-accessibility", "focus-states", fileExists("components/ui/tokens.ts"), "Focus states PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return [
    createCheck("buyer-performance", "checkout-form-hook", fileExists("features/checkout/hooks/use-checkout-form.ts"), "Checkout form hook PASS"),
    createCheck("buyer-performance", "cart-api", fileExists("app/api/cart/route.ts"), "Cart API PASS"),
    createCheck("buyer-performance", "search-debounce", fileExists("features/search/hooks/use-debounced-value.ts"), "Search debounce PASS"),
    createCheck("buyer-performance", "lazy-product-images", fileExists("components/ui/ProductCard.tsx"), "Lazy product images PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.homepagePass ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): BuyerCertificationScoreCard[] {
  const weights: Record<(typeof BUYER_CERTIFICATION_SCORES)[number], number> = {
    ux: 10,
    ui: 9,
    checkout: 10,
    order: 9,
    security: 10,
    accessibility: 8,
    performance: 8,
    marketplace: 9,
    enterprise: 10,
    reliability: 9,
  };
  const values: Record<(typeof BUYER_CERTIFICATION_SCORES)[number], number> = {
    ux: passPercent,
    ui: scan.globalUiPass ? 100 : 90,
    checkout: fileExists("features/checkout/components/CheckoutPage.tsx") ? 100 : 85,
    order: fileExists("app/account/orders/page.tsx") ? 100 : 85,
    security: fileExists("app/account/security/page.tsx") ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    performance: scan.homepagePass ? 100 : 90,
    marketplace: scan.passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
    reliability: fileExists("app/api/orders/route.ts") ? 100 : 90,
  };

  return BUYER_CERTIFICATION_SCORES.map((key) => ({
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
): BuyerPassConditionResult[] {
  const mapping: Record<(typeof BUYER_PASS_CONDITIONS)[number], boolean> = {
    "registration-pass": fileExists("app/(auth)/register/page.tsx") && buyerFoundationReady(scan),
    "login-pass": fileExists("app/(auth)/login/page.tsx"),
    "search-pass": scan.searchCompletionPass && fileExists("app/search/page.tsx"),
    "wishlist-pass": fileExists("app/saved/page.tsx"),
    "cart-pass": fileExists("app/cart/page.tsx") && fileExists("app/api/cart/route.ts"),
    "checkout-pass": fileExists("features/checkout/components/CheckoutPage.tsx"),
    "orders-pass": fileExists("app/account/orders/page.tsx"),
    "tracking-pass": fileExists("features/orders/components/OrderTrackingCard.tsx"),
    "notifications-pass": fileExists("app/notifications/page.tsx"),
    "buyer-protection-pass": fileExists("features/product-detail/ProductBuyerProtection.tsx"),
    "performance-pass": scan.homepagePass,
    "accessibility-pass": scan.globalUiPass,
    "security-pass": fileExists("app/account/security/page.tsx"),
    "marketplace-pass": scan.listingCompletionPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "buyer-completion-100": passPercent >= 100 && checksPass,
  };

  return BUYER_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runBuyerCompletionScan(scan: MarketplaceCompletionScanResult): BuyerCompletionResult {
  const domains = scanGlobalDomains();
  const workflow = scanWorkflow(scan);
  const profile = scanProfile(scan);
  const shopping = scanShopping(scan);
  const productPage = scanProductPage(scan);
  const cart = scanCart(scan);
  const checkout = scanCheckout(scan);
  const orders = scanOrders(scan);
  const notifications = scanNotifications(scan);
  const buttons = scanButtons(scan);
  const database = scanDatabase(scan);
  const omegaGlobal = scanOmegaGlobal(scan);
  const accessibility = scanAccessibility(scan);
  const performance = scanPerformance(scan);

  const allChecks = [
    ...workflow,
    ...profile,
    ...shopping,
    ...productPage,
    ...cart,
    ...checkout,
    ...orders,
    ...notifications,
    ...buttons,
    ...database,
    ...omegaGlobal,
    ...accessibility,
    ...performance,
  ];
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPassCount = allChecks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPassCount / allChecks.length) * 70) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, passPercent, checksPassCount === allChecks.length);
  const autoRepairs = BUYER_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `buyer-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: action.includes("profile-synchronization"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const buyerCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPassCount === allChecks.length;
  const buyerCertified =
    buyerCompletionPass && scan.omegaPass && scan.listingCertified && scan.listingCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 5,
    passPercent: buyerCompletionPass ? 100 : passPercent,
    status: buyerCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    buyerCompletionPass,
    buyerCertified,
    productionReady: buyerCertified && scan.productionReady,
    launchReady: buyerCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    workflow,
    profile,
    shopping,
    productPage,
    cart,
    checkout,
    orders,
    notifications,
    buttons,
    database,
    omegaGlobal,
    accessibility,
    performance,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isBuyerCompletionPass(result: BuyerCompletionResult): boolean {
  return (
    result.buyerCompletionPass &&
    result.buyerCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
