/**
 * ROVEXO Beta v1.0 — module registry.
 * Update status here and in ROADMAP.md when a module ships.
 */

export const BETA_VERSION = "1.0" as const;

export type BetaArea = "buyer" | "seller" | "business" | "payments";

export type BetaModuleStatus = "complete" | "in_progress" | "planned";

export type BetaModuleDefinition = {
  id: string;
  name: string;
  route: string;
  area: BetaArea;
  status: BetaModuleStatus;
  description: string;
};

export const BETA_MODULES = [
  {
    id: "buyer-homepage",
    name: "Homepage",
    route: "/",
    area: "buyer",
    status: "complete",
    description: "Product discovery with trending, new, and recommended sections.",
  },
  {
    id: "buyer-search",
    name: "Search",
    route: "/search",
    area: "buyer",
    status: "complete",
    description: "Live search overlay with products, sellers, stores, and categories.",
  },
  {
    id: "buyer-product-details",
    name: "Product Details",
    route: "/listing/[slug]",
    area: "buyer",
    status: "complete",
    description: "Gallery, pricing, seller info, delivery, and purchase actions.",
  },
  {
    id: "buyer-saved",
    name: "Saved",
    route: "/saved",
    area: "buyer",
    status: "complete",
    description: "Saved wishlist with filters, sort, multi-select, and ProductCard grid.",
  },
  {
    id: "buyer-notifications",
    name: "Notifications",
    route: "/notifications",
    area: "buyer",
    status: "complete",
    description: "Useful alerts with filters, swipe actions, and notification settings.",
  },
  {
    id: "buyer-messages",
    name: "Messages",
    route: "/messages",
    area: "buyer",
    status: "complete",
    description: "Buyer–seller inbox with filters, chat, and transaction actions.",
  },
  {
    id: "buyer-checkout",
    name: "Checkout",
    route: "/checkout/[slug]",
    area: "buyer",
    status: "complete",
    description: "Review order, payment, and order confirmation.",
  },
  {
    id: "buyer-orders",
    name: "Orders",
    route: "/orders",
    area: "buyer",
    status: "complete",
    description: "Buyer and seller order views with status tracking and actions.",
  },
  {
    id: "buyer-profile",
    name: "Buyer Profile",
    route: "/account",
    area: "buyer",
    status: "complete",
    description: "Profile, seller overview, menu, and account actions.",
  },
  {
    id: "buyer-settings",
    name: "Settings",
    route: "/settings",
    area: "buyer",
    status: "complete",
    description: "Account, notifications, appearance, privacy, payments, and selling preferences.",
  },
  {
    id: "seller-dashboard",
    name: "Dashboard",
    route: "/seller",
    area: "seller",
    status: "complete",
    description: "Seller overview with summary, performance chart, and recent orders.",
  },
  {
    id: "seller-sell-flow",
    name: "Sell Flow",
    route: "/sell",
    area: "seller",
    status: "complete",
    description: "Single-page listing creation with auto AI fill and publish.",
  },
  {
    id: "seller-listings",
    name: "My Listings",
    route: "/seller/listings",
    area: "seller",
    status: "complete",
    description: "Manage active, draft, and sold listings.",
  },
  {
    id: "seller-wallet",
    name: "Wallet",
    route: "/seller/wallet",
    area: "seller",
    status: "complete",
    description: "Balance, payouts, withdraw flow, and transaction history.",
  },
  {
    id: "seller-analytics",
    name: "Analytics",
    route: "/seller/analytics",
    area: "seller",
    status: "complete",
    description: "Revenue, charts, top products, traffic sources, and exports.",
  },
  {
    id: "seller-orders",
    name: "Orders",
    route: "/seller/orders",
    area: "seller",
    status: "complete",
    description: "Fulfillment, tracking, and seller order management.",
  },
  {
    id: "business-dashboard",
    name: "Business Dashboard",
    route: "/business/dashboard",
    area: "business",
    status: "complete",
    description: "Company overview with inventory, performance, and recent orders.",
  },
  {
    id: "business-inventory",
    name: "Inventory",
    route: "/business/inventory",
    area: "business",
    status: "complete",
    description: "Stock levels with active, low stock, and out of stock status.",
  },
  {
    id: "business-analytics",
    name: "Analytics",
    route: "/business/analytics",
    area: "business",
    status: "complete",
    description: "Performance, sales channels, top products, geographic sales, and exports.",
  },
  {
    id: "seller-ai-description",
    name: "AI Description",
    route: "/sell",
    area: "seller",
    status: "complete",
    description: "Generate listing descriptions during sell flow.",
  },
  {
    id: "seller-ai-price",
    name: "AI Price Suggestion",
    route: "/sell",
    area: "seller",
    status: "complete",
    description: "Suggested pricing based on listing details.",
  },
  {
    id: "seller-ai-camera",
    name: "AI Camera",
    route: "/sell",
    area: "seller",
    status: "complete",
    description: "Auto photo analysis with category tree matching and attribute detection.",
  },
  {
    id: "payments-buyer-protection",
    name: "Buyer Protection Fee",
    route: "/listing/[slug]",
    area: "payments",
    status: "complete",
    description: "Protected purchase fee shown on PDP and checkout.",
  },
  {
    id: "payments-release",
    name: "36 Hour Payment Release",
    route: "/orders",
    area: "payments",
    status: "complete",
    description: "Escrow release after delivery confirmation window.",
  },
  {
    id: "payments-shipping-label",
    name: "Seller Shipping Label",
    route: "/seller/orders",
    area: "payments",
    status: "complete",
    description: "Seller generates and attaches own shipping label.",
  },
  {
    id: "payments-return-policy",
    name: "Return Policy",
    route: "/checkout/[slug]",
    area: "payments",
    status: "complete",
    description: "Return window and policy acceptance at checkout.",
  },
  {
    id: "payments-refund",
    name: "Refund Flow",
    route: "/orders",
    area: "payments",
    status: "complete",
    description: "Buyer refund requests and seller resolution.",
  },
] as const satisfies readonly BetaModuleDefinition[];

export type BetaModuleId = (typeof BETA_MODULES)[number]["id"];

const moduleById = new Map<string, BetaModuleDefinition>(
  BETA_MODULES.map((module) => [module.id, module]),
);

export function getBetaModule(id: string): BetaModuleDefinition | undefined {
  return moduleById.get(id);
}

export function getBetaModulesByArea(area: BetaArea): BetaModuleDefinition[] {
  return BETA_MODULES.filter((module) => module.area === area);
}

export function getBetaProgress() {
  const modules = BETA_MODULES as readonly BetaModuleDefinition[];
  const complete = modules.filter((module) => module.status === "complete").length;
  const inProgress = modules.filter((module) => module.status === "in_progress").length;
  const planned = modules.filter((module) => module.status === "planned").length;

  return { complete, inProgress, planned, total: modules.length };
}
