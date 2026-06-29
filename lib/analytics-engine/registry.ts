import type { AnalyticsEngineModule } from "@/lib/analytics-engine/types";

export const ANALYTICS_ENGINE_MODULES: AnalyticsEngineModule[] = [
  { id: "marketplace-overview", label: "Marketplace Overview", icon: "📊", description: "Platform health and KPI summary", href: "/analytics" },
  { id: "revenue", label: "Revenue Analytics", icon: "💷", description: "Gross, net, fees, and conversion", href: "/analytics?tab=financial" },
  { id: "orders", label: "Orders Analytics", icon: "📦", description: "Order lifecycle and completion", href: "/orders" },
  { id: "listings", label: "Listings Analytics", icon: "🏷️", description: "Views, clicks, and conversion", href: "/seller/analytics" },
  { id: "shipping", label: "Shipping Analytics", icon: "🚚", description: "Delivery and carrier performance", href: "/shipping" },
  { id: "wallet", label: "Wallet Analytics", icon: "👛", description: "Balances, withdrawals, and activity", href: "/wallet" },
  { id: "payments", label: "Payments Analytics", icon: "💳", description: "Transactions, refunds, and fees", href: "/payments" },
  { id: "protection", label: "Buyer Protection Analytics", icon: "🛡️", description: "Cases, refunds, and resolution", href: "/protection" },
  { id: "messages", label: "Messages Analytics", icon: "💬", description: "Conversations and response time", href: "/messages?tab=analytics" },
  { id: "notifications", label: "Notifications Analytics", icon: "🔔", description: "Delivery and open rates", href: "/notifications?tab=analytics" },
  { id: "seller", label: "Seller Analytics", icon: "⭐", description: "Seller performance and trust", href: "/seller/analytics" },
  { id: "buyer", label: "Buyer Analytics", icon: "🛍️", description: "Purchases and lifetime value", href: "/analytics?tab=buyer" },
  { id: "business", label: "Business Analytics", icon: "🏢", description: "B2B revenue and channels", href: "/business/analytics" },
  { id: "support", label: "Support Analytics", icon: "🎧", description: "Tickets and response time", href: "/support" },
  { id: "search", label: "Search Analytics", icon: "🔍", description: "Top searches and conversion", href: "/search" },
  { id: "category", label: "Category Analytics", icon: "📁", description: "Category performance", href: "/categories" },
  { id: "export", label: "Export Center", icon: "📤", description: "CSV, Excel, PDF, and API export", href: "/analytics?tab=export" },
];

export const ANALYTICS_ENGINE_MODULE_IDS = [
  { id: "marketplace-overview", label: "Marketplace Overview" },
  { id: "revenue", label: "Revenue Analytics" },
  { id: "orders", label: "Orders Analytics" },
  { id: "listings", label: "Listings Analytics" },
  { id: "shipping", label: "Shipping Analytics" },
  { id: "wallet", label: "Wallet Analytics" },
  { id: "payments", label: "Payments Analytics" },
  { id: "protection", label: "Buyer Protection Analytics" },
  { id: "messages", label: "Messages Analytics" },
  { id: "notifications", label: "Notifications Analytics" },
  { id: "seller", label: "Seller Analytics" },
  { id: "buyer", label: "Buyer Analytics" },
  { id: "business", label: "Business Analytics" },
  { id: "support", label: "Support Analytics" },
  { id: "search", label: "Search Analytics" },
  { id: "category", label: "Category Analytics" },
  { id: "auction", label: "Auction Analytics" },
] as const;

export const ANALYTICS_ENGINE_LIVE_METRICS = [
  { id: "marketplace-health", label: "Marketplace Health" },
  { id: "revenue", label: "Revenue" },
  { id: "orders-today", label: "Orders Today" },
  { id: "orders-week", label: "Orders This Week" },
  { id: "orders-month", label: "Orders This Month" },
  { id: "active-users", label: "Active Users" },
  { id: "online-users", label: "Online Users" },
  { id: "active-sellers", label: "Active Sellers" },
  { id: "new-listings", label: "New Listings" },
  { id: "messages", label: "Messages" },
  { id: "notifications", label: "Notifications" },
  { id: "support-tickets", label: "Support Tickets" },
  { id: "disputes", label: "Disputes" },
  { id: "returns", label: "Returns" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "server-status", label: "Server Status" },
  { id: "api-status", label: "API Status" },
  { id: "database-status", label: "Database Status" },
] as const;

export const ANALYTICS_ENGINE_REPORT_PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom Reports" },
] as const;

export const ANALYTICS_ENGINE_EXPORT_FORMATS = [
  { id: "csv", label: "CSV" },
  { id: "excel", label: "Excel" },
  { id: "pdf", label: "PDF" },
  { id: "json", label: "JSON" },
  { id: "api", label: "API Export" },
] as const;

export const ANALYTICS_ENGINE_LIVE_CHARTS = [
  { id: "revenue", label: "Revenue" },
  { id: "orders", label: "Orders" },
  { id: "traffic", label: "Traffic" },
  { id: "messages", label: "Messages" },
  { id: "notifications", label: "Notifications" },
  { id: "wallet", label: "Wallet" },
  { id: "payments", label: "Payments" },
  { id: "protection", label: "Protection" },
  { id: "listings", label: "Listings" },
  { id: "users", label: "Users" },
] as const;

export function registerAnalyticsEngineModule(module: AnalyticsEngineModule): AnalyticsEngineModule[] {
  const index = ANALYTICS_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...ANALYTICS_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...ANALYTICS_ENGINE_MODULES, module];
}
