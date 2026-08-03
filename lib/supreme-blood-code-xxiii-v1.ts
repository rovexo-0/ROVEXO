/**
 * ROVEXO SUPREME BLOOD CODE XXIII
 * SPRINT VI — CHECKOUT · OWNER CERTIFIED · PERMANENT FREEZE
 * 100% VERIFIED + 100% AUDITED + OWNER VISUAL = REQUIRED GATES (not invent PASS)
 *
 * STATUS: 100% COMPLETE · OWNER CERTIFIED · PERMANENT FREEZE · 2026-08-03
 * NEVER REMOVE
 *
 * Sprint VI may modify ONLY http://localhost:3000/checkout (post-freeze: critical only)
 * One Checkout = one entry point = /checkout
 * Live: LOCKED — Owner visually verified complete Checkout flow · Checkout v1.0 frozen.
 *
 * ONE CLICK = ONE PAYMENT = ONE ORDER = ONE TRANSACTION
 */

export const SUPREME_BLOOD_CODE_XXIII_V1 = {
  version: "23.0",
  codename: "SPRINT_VI_CHECKOUT_OWNER_CERTIFIED_PERMANENT_FREEZE",
  status: "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
  sprint: "VI" as const,
  module: "CHECKOUT" as const,
  developmentStatus: "PERMANENTLY_FROZEN" as const,
  mode: "POST_FREEZE_CRITICAL_ONLY" as const,
  verifiedGateRequired: true,
  auditedGateRequired: true,
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: true,
  permanentlyFrozen: true,
  complete100: true,
  ownerCertified: true,
  neverRemove: true,
  approvedAt: "2026-07-23",
  ownerCertifiedAt: "2026-08-03",

  absoluteScopeLaw: {
    mayModifyOnly: "http://localhost:3000/checkout",
    forbiddenToTouch: [
      "Homepage",
      "Inbox",
      "Conversation Hub",
      "Orders",
      "Wallet",
      "Sell",
      "Shipping",
      "Account",
      "Settings",
      "Profile",
      "Legal Center",
      "Help Center",
    ] as const,
  } as const,

  checkoutLaw: {
    oneImplementation: true,
    oneEntryPoint: "/checkout",
    officialUrl: "http://localhost:3000/checkout",
    allowedOnly: ["/checkout"] as const,
  } as const,

  absoluteGoal: {
    buyerMustAlwaysKnow: [
      "WHAT IS BEING PURCHASED",
      "HOW MUCH IS BEING PAID",
      "WHERE THE ORDER IS GOING",
      "WHICH PAYMENT METHOD IS USED",
      "IF THE PAYMENT WAS SUCCESSFUL",
    ] as const,
    ifBuyerConfused: "PRODUCT_FAIL",
    feel: ["FAST", "SAFE", "INTUITIVE", "TRANSPARENT", "PRODUCTION_READY"] as const,
  } as const,

  masterCheckoutFlow: [
    "BUY_NOW",
    "CHECKOUT",
    "PRODUCT_SUMMARY",
    "DELIVERY_SUMMARY",
    "PAYMENT_METHOD",
    "PRICE_SUMMARY",
    "CONFIRM_AND_PAY",
    "PAYMENT_PROCESSING",
    "PAYMENT_SUCCESSFUL",
    "ORDER_CREATED",
    "ORDER_CONFIRMED",
    "DONE",
  ] as const,

  productSummary: {
    supported: [
      "Product Image",
      "Product Title",
      "Condition",
      "Quantity",
      "Seller Information",
      "Product Price",
    ] as const,
    forbidden: [
      "Duplicate Products",
      "Duplicate Prices",
      "Empty Containers",
      "Broken Images",
    ] as const,
  } as const,

  deliverySummary: {
    supported: [
      "Delivery Address",
      "Delivery Method",
      "Estimated Delivery",
      "Parcel Information",
    ] as const,
    forbidden: [
      "Missing Addresses",
      "Broken Delivery States",
      "Empty Sections",
    ] as const,
  } as const,

  paymentMethod: {
    supported: [
      "Saved Cards",
      "Add New Card",
      "Change Payment Method",
      "Default Payment Method",
    ] as const,
    forbidden: [
      "Broken Payment Methods",
      "Duplicate Payment Requests",
      "Failed Selection States",
    ] as const,
  } as const,

  priceSummary: {
    lines: ["Product Price", "Shipping", "Platform Fee", "TOTAL TO PAY"] as const,
    totalMustAlwaysBeVisible: true,
    buyerMustNeverAsk: [
      "What am I paying for?",
      "Is this the final price?",
      "Did I pay twice?",
    ] as const,
  } as const,

  paymentLaw: {
    oneClickEqualsOnePayment: true,
    onePaymentEqualsOneOrder: true,
    oneOrderEqualsOneTransaction: true,
    noExceptions: true,
  } as const,

  confirmAndPay: {
    flow: [
      "CONFIRM_AND_PAY",
      "PAYMENT_PROCESSING",
      "PLEASE_WAIT",
      "PAYMENT_SUCCESSFUL",
      "ORDER_CONFIRMED",
      "DONE",
    ] as const,
    buyerMustNever: [
      "Press Confirm Twice",
      "Press Pay Twice",
      "Create Duplicate Orders",
      "Create Duplicate Payments",
      "Experience Silent Processing",
    ] as const,
  } as const,

  paymentProcessing: {
    states: [
      "Processing Payment…",
      "Please Wait…",
      "Creating Your Order…",
      "Order Confirmed",
    ] as const,
    forbidden: [
      "Infinite Loading",
      "Silent Loading",
      "Broken Redirects",
      "Failed States Without Messages",
    ] as const,
  } as const,

  /** Absolute Law FINAL LOCK: DONE only after readiness gates PASS. */
  successExperience: {
    flow: [
      "Payment Successful",
      "Thank You For Shopping With Rovexo",
      "Product",
      "Total Amount",
      "DONE_GATES_PASS",
      "DONE",
      "AUTO_OPEN_TRANSACTION_CONVERSATION",
    ] as const,
    actionsOnly: ["DONE"] as const,
    onlyThreeActionsAllowed: false,
    doneEqualsMessages: true,
    doneEqualsTransactionConversation: true,
    doneRequiresAllGatesPass: true,
    forbiddenActions: [
      "Track Order",
      "Message Seller",
      "Continue Shopping",
      "View Order",
      "Home",
      "My Orders",
      "Inbox List",
      "Messages List",
      "Inbox Fallback",
      "Please Try Again",
      "Loading",
    ] as const,
    absoluteLaw: "lib/checkout/checkout-absolute-law-v1.ts",
    doneGate: "lib/checkout/done-readiness-gate-v1.ts",
  } as const,

  searchBarLaw: {
    forbiddenOnCheckout: true,
    mustNeverContain: ["Search Bar", "Homepage Header", "Marketplace Header"] as const,
  } as const,

  bottomNavigationLaw: {
    forbiddenOnCheckout: true,
    flowFocusedPage: true,
  } as const,

  responsiveLaw: {
    supported: ["iPhone", "Android", "Tablets", "Desktop"] as const,
    masterDevice: "IPHONE_17_PRO_MAX",
  } as const,

  verifiedMustPass: [
    "TypeScript PASS",
    "ESLint PASS",
    "Build PASS",
    "Functional QA PASS",
    "Responsive QA PASS",
    "Mobile QA PASS",
    "Visual QA PASS",
    "Payment QA PASS",
    "Financial QA PASS",
    "localhost QA PASS",
    "Production QA PASS",
    "NO REGRESSION QA PASS",
    "AUTOMATIC CERTIFICATION PASS",
    "OWNER CERTIFICATION PASS",
  ] as const,

  withoutAllVerifiedPasses: "PRODUCT_FAIL",

  auditedMustVerify: [
    "Payment States",
    "Financial Calculations",
    "Shipping Calculations",
    "Platform Fee Calculations",
    "Order Creation",
    "Success Experience",
    "Error States",
    "Loading States",
    "Empty States",
    "Mobile Behaviour",
    "Responsive Behaviour",
    "Production Readiness",
  ] as const,

  zeroRegressionMustNeverBreak: ["I", "II", "III", "IV", "V"] as const,
  regressionExistsEquals: "PRODUCT_FAIL",

  localhostLaw: {
    official: "http://localhost:3000/checkout",
  } as const,

  liveSprintStatus: {
    I: "LOCKED",
    II: "LOCKED",
    III: "LOCKED",
    IV: "LOCKED",
    V: "LOCKED",
    VI: "LOCKED",
    VII: "FORBIDDEN_TO_START",
    VIII: "FORBIDDEN_TO_START",
  } as const,

  absolutePaymentEquation: [
    "ONE_PAYMENT_EQUALS_ONE_ORDER_EQUALS_ONE_TRANSACTION",
    "ZERO_CONFUSION",
    "ZERO_DUPLICATE_PAYMENTS",
    "ZERO_REGRESSIONS",
  ] as const,

  ssot: {
    code: "lib/supreme-blood-code-xxiii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xxiii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XXIII_V1.md",
    checkoutPage: "features/checkout/components/CheckoutPage.tsx",
    freeze: "lib/checkout/freeze.ts",
  } as const,

  parentLaws: {
    bloodXxii: "lib/supreme-blood-code-xxii-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    bloodXvi: "lib/supreme-blood-code-xvi-v1.ts",
    bloodXvii: "lib/supreme-blood-code-xvii-v1.ts",
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    canonicalFinancial: ".cursor/rules/canonical-financial-rules.mdc",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
  } as const,

  childLaws: {
    absoluteFinancialLawFreeze: "lib/supreme-blood-code-xxiv-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXxiiiV1 = typeof SUPREME_BLOOD_CODE_XXIII_V1;

export function isBloodXxiiiCheckoutRouteAllowed(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/checkout" || path.startsWith("/checkout/");
}

export function resolveBloodXxiiiScopePolicy(pathname: string): {
  allowed: boolean;
  policy: readonly string[];
} {
  if (isBloodXxiiiCheckoutRouteAllowed(pathname)) {
    return { allowed: true, policy: ["EXECUTE_WITHIN_/checkout"] as const };
  }
  return {
    allowed: false,
    policy: ["STOP", "FORBIDDEN_CROSS_MODULE", "CHECKOUT_ONLY"] as const,
  };
}

export function resolveBloodXxiiiPermanentFreeze(input: {
  verifiedAllPass: boolean;
  auditedAllPass: boolean;
  automaticCertificationPass: boolean;
  ownerCertificationPass: boolean;
  noRegressionPass: boolean;
  complete100: boolean;
}): "PERMANENT_FREEZE" | "NOT_READY" {
  return Object.values(input).every(Boolean) ? "PERMANENT_FREEZE" : "NOT_READY";
}

export function isBloodXxiiiBottomNavForbidden(): true {
  return true;
}
