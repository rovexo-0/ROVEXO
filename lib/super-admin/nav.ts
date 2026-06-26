export type SuperAdminNavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: string;
};

/** Primary super-admin navigation shown in profile menu and shell. */
export const SUPER_ADMIN_PRIMARY_NAV: SuperAdminNavItem[] = [
  { href: "/super-admin", label: "Super Admin Dashboard", description: "Platform overview", icon: "📊" },
  { href: "/super-admin/users", label: "Users", description: "Accounts & sessions", icon: "👤" },
  { href: "/super-admin/listings", label: "Listings", description: "All marketplace listings", icon: "🏷️" },
  { href: "/super-admin/categories", label: "Categories", description: "Taxonomy tree", icon: "📁" },
  { href: "/super-admin/orders", label: "Orders", description: "Order management", icon: "📦" },
  { href: "/super-admin/payments", label: "Payments", description: "Transactions", icon: "💳" },
  { href: "/super-admin/wallet", label: "Wallet", description: "Balances & withdrawals", icon: "👛" },
  { href: "/super-admin/reports", label: "Reports", description: "Moderation queue", icon: "🚩" },
  { href: "/super-admin/analytics", label: "Analytics", description: "Platform metrics", icon: "📈" },
  { href: "/super-admin/seo", label: "SEO", description: "Search optimisation", icon: "🌐" },
  { href: "/super-admin/platform", label: "Platform Settings", description: "Feature flags & maintenance", icon: "⚙️" },
  { href: "/super-admin/notifications", label: "Notifications", description: "Broadcast messages", icon: "🔔" },
  { href: "/super-admin/trust", label: "Trust Centre", description: "Scores & verification", icon: "🛡️" },
  { href: "/super-admin/moderation", label: "Moderation", description: "Content moderation", icon: "🧹" },
  { href: "/super-admin/reviews", label: "Reviews", description: "Product reviews", icon: "⭐" },
  { href: "/super-admin/coupons", label: "Coupons", description: "Discount codes", icon: "🎟️" },
  { href: "/super-admin/promotions", label: "Promotions", description: "Featured & bumps", icon: "📣" },
  { href: "/super-admin/email", label: "Email Centre", description: "Outbound email", icon: "✉️" },
  { href: "/super-admin/support", label: "Support", description: "Help centre ops", icon: "🎧" },
  { href: "/super-admin/monitoring", label: "System Health", description: "Infra & cron", icon: "💚" },
  { href: "/super-admin/operations", label: "AI Operations Center", description: "AI monitoring & repair", icon: "🤖" },
  { href: "/super-admin/audit", label: "Logs", description: "Audit history", icon: "📋" },
  { href: "/super-admin/backups", label: "Backups", description: "Backup centre", icon: "💾" },
];

export type SuperAdminNavSection = {
  id: string;
  title: string;
  items: SuperAdminNavItem[];
};

export const SUPER_ADMIN_NAV: SuperAdminNavSection[] = [
  {
    id: "command",
    title: "Command",
    items: [
      { href: "/super-admin", label: "Dashboard", description: "Platform overview", icon: "📊" },
      { href: "/super-admin/command", label: "Command Centre", description: "Quick actions", icon: "⚡" },
      { href: "/super-admin/search", label: "Global Search", description: "Search everything", icon: "🔍" },
      { href: "/super-admin/activity", label: "Activity Timeline", description: "Recent audit events", icon: "🕒" },
    ],
  },
  {
    id: "people",
    title: "People & Trust",
    items: [
      { href: "/super-admin/users", label: "Users", description: "Accounts & sessions", icon: "👤" },
      { href: "/super-admin/businesses", label: "Businesses", description: "B2B accounts", icon: "🏢" },
      { href: "/super-admin/verification", label: "Verification", description: "Identity queue", icon: "✅" },
      { href: "/super-admin/trust", label: "Trust Centre", description: "Scores & adjustments", icon: "🛡️" },
      { href: "/super-admin/fraud", label: "Fraud", description: "Risk & scam reports", icon: "🚨" },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    items: [
      { href: "/super-admin/listings", label: "Listings", description: "All products", icon: "🏷️" },
      { href: "/super-admin/categories", label: "Categories", description: "Taxonomy tree", icon: "📁" },
      { href: "/super-admin/orders", label: "Orders", description: "Order management", icon: "📦" },
      { href: "/super-admin/featured", label: "Featured", description: "Featured placements", icon: "⭐" },
      { href: "/super-admin/bumps", label: "Bumps", description: "Bump promotions", icon: "📈" },
      { href: "/super-admin/promotions", label: "Promotions", description: "Campaign overview", icon: "📣" },
      { href: "/super-admin/coupons", label: "Coupons", description: "Discount codes", icon: "🎟️" },
      { href: "/super-admin/reviews", label: "Reviews", description: "Product reviews", icon: "💬" },
      { href: "/super-admin/auctions", label: "Auctions", description: "Live auctions & subscribers", icon: "🔨" },
    ],
  },
  {
    id: "money",
    title: "Payments & Revenue",
    items: [
      { href: "/super-admin/payments", label: "Payments", description: "Transactions", icon: "💳" },
      { href: "/super-admin/revenue", label: "Revenue", description: "Platform revenue", icon: "💰" },
      { href: "/super-admin/wallet", label: "Wallet", description: "Balances & withdrawals", icon: "👛" },
      { href: "/super-admin/subscriptions", label: "Subscriptions", description: "Plans & billing", icon: "📦" },
      { href: "/super-admin/grants", label: "Free Benefits", description: "Manual grants", icon: "🎁" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { href: "/super-admin/reports", label: "Reports", description: "Moderation queue", icon: "🚩" },
      { href: "/super-admin/moderation", label: "Moderation", description: "Content moderation", icon: "🧹" },
      { href: "/super-admin/analytics", label: "Analytics", description: "Platform metrics", icon: "📈" },
      { href: "/super-admin/support", label: "Support", description: "Help centre ops", icon: "🎧" },
      { href: "/super-admin/notifications", label: "Notifications", description: "Broadcast messages", icon: "🔔" },
      { href: "/super-admin/email", label: "Email Centre", description: "Outbound email", icon: "✉️" },
      { href: "/super-admin/monitoring", label: "System Health", description: "Infra & cron", icon: "💚" },
      { href: "/super-admin/operations", label: "AI Operations Center", description: "AI monitoring & repair", icon: "🤖" },
      { href: "/super-admin/visitors", label: "Live Visitors", description: "Online users", icon: "👁️" },
      { href: "/super-admin/backups", label: "Backups", description: "Backups & restore", icon: "💾" },
    ],
  },
  {
    id: "platform",
    title: "Platform Control",
    items: [
      { href: "/super-admin/platform", label: "Settings", description: "Maintenance & features", icon: "⚙️" },
      { href: "/super-admin/seo", label: "SEO", description: "Search optimisation", icon: "🌐" },
      { href: "/super-admin/security", label: "Security", description: "Audit & sessions", icon: "🔐" },
      { href: "/super-admin/audit", label: "Logs", description: "Full action history", icon: "📋" },
    ],
  },
];

export const SUPER_ADMIN_QUICK_LINKS = SUPER_ADMIN_NAV.flatMap((section) => section.items);
