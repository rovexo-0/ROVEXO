/**
 * ROVEXO SUPREME BLOOD CODE XII
 * SPRINT III — ORDERS · 100% COMPLETE · PERMANENT FREEZE
 *
 * STATUS: APPROVED · PERMANENT FREEZE · 2026-07-23
 * NEVER REMOVE
 *
 * Official route: http://localhost:3000/orders
 * After Owner certification: modify only for critical bugs with Owner approval.
 */

export const SUPREME_BLOOD_CODE_XII_V1 = {
  version: "12.0",
  codename: "SPRINT_III_ORDERS_PERMANENT_FREEZE",
  status: "APPROVED",
  sprint: "III" as const,
  module: "ORDERS" as const,
  completion: "100_COMPLETE" as const,
  permanentFreeze: true,
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  officialRoute: "/orders",
  officialLocalhost: "http://localhost:3000/orders",

  header: {
    allowed: ["Back", "Orders"] as const,
    forbidden: [
      "Search Bar",
      "Homepage Header",
      "ROVEXO Logo",
      "Notifications icon",
      "Saved icon",
      "duplicated actions",
    ] as const,
  } as const,

  bottomNavigation: {
    visible: true,
    permanent: true,
    items: ["Home", "Search", "Sell", "Inbox", "Account"] as const,
  } as const,

  buyerStatuses: [
    "Awaiting payment",
    "Paid",
    "Preparing order",
    "Shipped",
    "Delivered",
    "Completed",
    "Cancelled",
    "Refunded",
    "Returned",
  ] as const,

  sellerStatuses: [
    "Awaiting payment",
    "Preparing order",
    "Ready to ship",
    "Shipped",
    "Completed",
    "Cancelled",
    "Refunded",
  ] as const,

  productCard: {
    fields: [
      "Product image",
      "Product title",
      "Total incl.",
      "Seller name",
      "Buyer name",
      "Order number",
      "Current status",
    ] as const,
    oneCardOnly: true,
  } as const,

  tracking: {
    supported: [
      "Parcel 1 of 1",
      "Parcel 1 of 2",
      "Parcel 2 of 2",
      "Tracking number",
      "Shipping company",
      "Delivery status",
      "Estimated delivery",
    ] as const,
    noDuplicates: true,
  } as const,

  buyerActions: [
    "Contact seller",
    "Track parcel",
    "Leave review",
    "Report problem",
    "Request return",
    "Open dispute",
  ] as const,

  sellerActions: [
    "Contact buyer",
    "Prepare order",
    "Confirm dispatch",
    "Refund order",
    "Cancel order",
  ] as const,

  financial: {
    buyer: ["Subtotal", "Shipping", "Buyer Protection", "TOTAL PAID"] as const,
    seller: ["Subtotal", "Shipping", "YOU'LL RECEIVE"] as const,
    absoluteLaw: {
      buyerMustNeverSee: "YOU'LL RECEIVE",
      sellerMustNeverSee: "TOTAL PAID",
    },
  } as const,

  timeline: {
    happyPath: [
      "Offer accepted",
      "Paid",
      "Preparing",
      "Shipped",
      "Delivered",
      "Completed",
    ] as const,
    cancelled: ["Offer accepted", "Cancelled"] as const,
    refunded: ["Paid", "Refunded"] as const,
    returned: ["Delivered", "Return approved", "Returned", "Refunded"] as const,
  } as const,

  searchBarLaw: {
    allowedOnlyOn: "/",
    elsewhere: "UNMOUNTED",
    hideTricksForbidden: true,
  } as const,

  forbidden: [
    "duplicated cards",
    "duplicated totals",
    "duplicated tracking",
    "duplicated actions",
    "duplicated buttons",
    "duplicated timelines",
    "duplicated sections",
    "desktop designs",
    "marketplace header",
    "search bar",
    "redesigns",
    "new designs",
    "new components",
    "cross module changes",
  ] as const,

  absoluteLaw: [
    "ONE_MODULE_ONE_IMPLEMENTATION",
    "ONE_FEATURE_ONE_ENTRY_POINT",
    "NO_DUPLICATES",
    "NO_CROSS_MODULE_CHANGES",
    "NO_NEW_DESIGNS",
    "NO_NEW_COMPONENTS",
  ] as const,

  masterDevice: "IPHONE_17_PRO_MAX" as const,

  postFreezeAllowed: [
    "Critical bug fixes",
    "Owner approval",
  ] as const,

  sprintStatus: {
    I: { module: "INBOX", status: "LOCKED" },
    II: { module: "CONVERSATION_HUB", status: "LOCKED" },
    III: { module: "ORDERS", status: "LOCKED", completion: "100_COMPLETE" },
    IV: { module: "WALLET", status: "LOCKED" },
  } as const,

  ssot: {
    code: "lib/supreme-blood-code-xii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XII_V1.md",
    masterUi: "docs/modules/orders/MASTER_UI_SPECIFICATION.md",
    page: "features/orders/components/OrdersPage.tsx",
    css: "styles/rovexo/orders-page-v1.css",
    status: "lib/orders/orders-v7-status.ts",
    route: "app/(platform)/orders/page.tsx",
  } as const,

  parentLaws: {
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXiiV1 = typeof SUPREME_BLOOD_CODE_XII_V1;

export function isOrdersModuleFrozen(): true {
  return true;
}

export function isOrdersRoute(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/orders" || path.startsWith("/orders/");
}

export function resolveBloodXiiPostFreezePolicy(changeType: string): {
  allowed: boolean;
  reason: string;
} {
  const normalized = changeType.trim().toLowerCase();
  if (normalized.includes("critical") || normalized.includes("security")) {
    return { allowed: true, reason: "Critical/security fix requires Owner approval trail." };
  }
  if (normalized.includes("owner")) {
    return { allowed: true, reason: "Explicit Owner approval." };
  }
  return {
    allowed: false,
    reason: "Sprint III Orders is permanently frozen. No redesigns or cross-module changes.",
  };
}
