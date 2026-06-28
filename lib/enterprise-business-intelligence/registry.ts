export const ENTERPRISE_BI_ROUTES = [
  { id: "dashboard", label: "Business Intelligence", href: "/super-admin/business-intelligence" },
  { id: "dashboard-alt", label: "Executive Dashboard", href: "/super-admin/business-intelligence/dashboard" },
  { id: "kpis", label: "KPI Engine", href: "/super-admin/business-intelligence/kpis" },
  { id: "revenue", label: "Revenue Analytics", href: "/super-admin/business-intelligence/revenue" },
  { id: "users", label: "User Analytics", href: "/super-admin/business-intelligence/users" },
  { id: "orders", label: "Order Analytics", href: "/super-admin/business-intelligence/orders" },
  { id: "sellers", label: "Seller Analytics", href: "/super-admin/business-intelligence/sellers" },
  { id: "products", label: "Product Analytics", href: "/super-admin/business-intelligence/products" },
  { id: "forecasting", label: "AI Forecasting", href: "/super-admin/business-intelligence/forecasting" },
  { id: "reports", label: "Executive Reports", href: "/super-admin/business-intelligence/reports" },
  { id: "export", label: "Export Center", href: "/super-admin/business-intelligence/export" },
  { id: "settings", label: "Settings", href: "/super-admin/business-intelligence/settings" },
] as const;

export const KPI_PERIODS = ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"] as const;

export const REPORT_TYPES = [
  "revenue", "marketplace", "seller", "buyer", "business", "security", "incident", "deployment",
] as const;

export const FORECAST_TYPES = [
  "revenue", "growth", "demand", "capacity", "marketplace-trends",
] as const;

export const EXPORT_FORMATS = ["pdf", "csv", "excel", "json"] as const;

export const TRAFFIC_SOURCES = ["organic", "direct", "referral", "social", "paid", "email"] as const;

export const FINANCIAL_METRICS = [
  "revenue", "buyer-protection-fees", "subscriptions", "advertising", "featured-listings",
  "promotions", "refunds", "chargebacks", "stripe-metrics", "wallet-balance",
] as const;

export const MARKETPLACE_METRICS = [
  "top-categories", "top-products", "top-sellers", "top-buyers", "featured-listings",
  "promoted-listings", "auctions", "coupons", "subscriptions", "wallet-usage",
] as const;

export const COMPLIANCE_FRAMEWORKS = ["gdpr", "security-audit", "access-logs", "permission-review", "mfa-compliance", "password-policy", "security-policies"] as const;

export const ENTERPRISE_BI_API = {
  snapshot: "/api/super-admin/business-intelligence",
  action: "/api/super-admin/business-intelligence/action",
  refresh: "/api/super-admin/business-intelligence/refresh",
  calculate: "/api/super-admin/business-intelligence/calculate",
  forecast: "/api/super-admin/business-intelligence/forecast",
  export: "/api/super-admin/business-intelligence/export",
  import: "/api/super-admin/business-intelligence/import",
  v1Snapshot: "/api/v1/super-admin/business-intelligence",
} as const;

export const AI_BI_SOURCES = ["scan", "sentinel", "omega"] as const;
