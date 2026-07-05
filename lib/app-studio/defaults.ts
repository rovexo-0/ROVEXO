import type {
  AppStudioAutomation,
  AppStudioCustomModule,
  AppStudioDocument,
  AppStudioHistoryEntry,
  AppStudioNavigationConfig,
  AppStudioNotificationAlert,
  AppStudioPage,
  AppStudioPlugin,
  AppStudioRecoveryPoint,
  AppStudioSecurityConfig,
} from "@/lib/app-studio/types";

const now = () => new Date().toISOString();

export function createDefaultAppStudioDocument(label = "ROVEXO Enterprise"): AppStudioDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    customModules: createDefaultCustomModules(),
    pages: createDefaultPages(),
    navigation: createDefaultNavigation(),
    automations: createDefaultAutomations(),
    security: createDefaultSecurity(),
    plugins: createDefaultPlugins(),
    recoveryPoints: createDefaultRecoveryPoints(),
    notificationAlerts: createDefaultNotificationAlerts(),
    auditLog: [],
  };
}

export function createDefaultAppStudioHistory(): AppStudioHistoryEntry[] {
  return [];
}

function createDefaultCustomModules(): AppStudioCustomModule[] {
  return [
    {
      id: "seller-onboarding",
      name: "Seller Onboarding",
      icon: "🚀",
      description: "Guided seller setup wizard",
      route: "/sell/new",
      permissions: ["read", "write"],
      visibility: "public",
      status: "live",
      version: 1,
      navigation: true,
      analytics: true,
      notifications: true,
      aiIntegration: true,
      featureFlags: ["import-wizard"],
      updatedAt: now(),
    },
  ];
}

function createDefaultPages(): AppStudioPage[] {
  return [
    { id: "homepage", name: "Homepage", pageType: "homepage", route: "/", status: "published", version: 1, updatedAt: now() },
    { id: "business-directory", name: "Business Directory", pageType: "business", route: "/business/directory", status: "published", version: 1, updatedAt: now() },
    { id: "help-center", name: "Help Center", pageType: "help-center", route: "/help", status: "published", version: 1, updatedAt: now() },
    { id: "legal", name: "Legal Pages", pageType: "legal", route: "/legal", status: "published", version: 1, updatedAt: now() },
    { id: "campaign-auctions", name: "Auctions Campaign", pageType: "campaign", route: "/auctions", status: "draft", version: 1, updatedAt: now() },
  ];
}

function navSection(id: string, label: string, items: AppStudioNavigationConfig["topNav"]["items"]): AppStudioNavigationConfig["topNav"] {
  return { id, label, items };
}

function createDefaultNavigation(): AppStudioNavigationConfig {
  const homeItems = [
    { id: "home", label: "Home", href: "/", icon: "🏠", visible: true },
    { id: "search", label: "Search", href: "/search", icon: "🔍", visible: true },
    { id: "sell", label: "Sell", href: "/sell", icon: "➕", visible: true },
    { id: "messages", label: "Messages", href: "/messages", icon: "💬", badge: "3", visible: true },
    { id: "account", label: "Account", href: "/account", icon: "👤", visible: true },
  ];

  return {
    topNav: navSection("top-nav", "Top Navigation", homeItems),
    bottomNav: navSection("bottom-nav", "Bottom Navigation", homeItems),
    sidebar: navSection("sidebar", "Sidebar", [
      { id: "dashboard", label: "Dashboard", href: "/seller/dashboard", icon: "📊", visible: true },
      { id: "listings", label: "Listings", href: "/seller/listings", icon: "🏷️", visible: true },
      { id: "orders", label: "Orders", href: "/seller/orders", icon: "📦", visible: true },
    ]),
    footerNav: navSection("footer", "Footer Navigation", [
      { id: "about", label: "About", href: "/legal", visible: true },
      { id: "support", label: "Support", href: "/support", visible: true },
    ]),
    accountNav: navSection("account", "Account Menu", [
      { id: "profile", label: "Profile", href: "/account/profile", visible: true },
      { id: "orders", label: "Orders", href: "/account/orders", visible: true },
      { id: "settings", label: "Settings", href: "/account/settings", visible: true },
    ]),
    businessNav: navSection("business", "Business Menu", [
      { id: "center", label: "Business Dashboard", href: "/business/dashboard", visible: true },
      { id: "inventory", label: "Inventory", href: "/business/inventory", visible: true },
    ]),
    sellerNav: navSection("seller", "Seller Menu", [
      { id: "dashboard", label: "Dashboard", href: "/seller/dashboard", visible: true },
      { id: "wallet", label: "Wallet", href: "/seller/wallet", visible: true },
    ]),
    buyerNav: navSection("buyer", "Buyer Menu", [
      { id: "saved", label: "Saved", href: "/saved", visible: true },
      { id: "orders", label: "Orders", href: "/orders", visible: true },
    ]),
    supportNav: navSection("support", "Support Menu", [
      { id: "help", label: "Help", href: "/help", visible: true },
      { id: "contact", label: "Contact", href: "/support", visible: true },
    ]),
    mobileNav: navSection("mobile", "Mobile Navigation", homeItems),
    desktopNav: navSection("desktop", "Desktop Navigation", homeItems),
  };
}

function createDefaultAutomations(): AppStudioAutomation[] {
  return [
    {
      id: "seller-verified-unlock",
      name: "IF Seller Verified THEN Unlock Features",
      moduleId: "seller",
      trigger: { type: "event", label: "Seller verified" },
      conditions: [{ id: "verified", expression: "seller.verified === true" }],
      actions: [{ id: "unlock", type: "action", label: "Unlock seller features" }],
      aiEnabled: false,
      status: "published",
      version: 1,
      updatedAt: now(),
    },
    {
      id: "order-paid-notify",
      name: "IF Order Paid THEN Notify Seller",
      moduleId: "orders",
      trigger: { type: "event", label: "Order paid" },
      conditions: [{ id: "paid", expression: "order.status === paid" }],
      actions: [
        { id: "notify", type: "notification", label: "Notify seller" },
        { id: "email", type: "email", label: "Send email" },
      ],
      aiEnabled: false,
      status: "published",
      version: 1,
      updatedAt: now(),
    },
    {
      id: "shipping-delivered-release",
      name: "IF Shipping Delivered THEN Release Funds",
      moduleId: "wallet",
      trigger: { type: "event", label: "Shipping delivered" },
      conditions: [{ id: "delivered", expression: "shipment.status === delivered" }],
      actions: [{ id: "release", type: "action", label: "Release wallet funds" }],
      schedule: "immediate",
      aiEnabled: false,
      status: "published",
      version: 1,
      updatedAt: now(),
    },
    {
      id: "report-notify-mods",
      name: "IF Report Submitted THEN Notify Moderators",
      moduleId: "support",
      trigger: { type: "event", label: "Report submitted" },
      conditions: [{ id: "report", expression: "report.created === true" }],
      actions: [
        { id: "push", type: "push", label: "Push notification" },
        { id: "internal", type: "internal-message", label: "Internal message" },
      ],
      aiEnabled: true,
      status: "draft",
      version: 1,
      updatedAt: now(),
    },
  ];
}

function createDefaultSecurity(): AppStudioSecurityConfig {
  return {
    globalTwoFactor: false,
    emergencyLockdown: false,
    suspiciousActivityDetection: true,
    apiKeysEnabled: true,
    roles: [
      { id: "super-admin", name: "Super Admin", permissions: ["read", "write", "publish", "delete", "manage-ai", "manage-theme"], twoFactorRequired: true, status: "published" },
      { id: "support-admin", name: "Support Admin", permissions: ["read", "moderate"], twoFactorRequired: false, status: "published" },
      { id: "analytics-viewer", name: "Analytics Viewer", permissions: ["read"], twoFactorRequired: false, status: "draft" },
    ],
  };
}

function createDefaultPlugins(): AppStudioPlugin[] {
  return [
    { id: "mission-control", name: "Mission Control", type: "official", version: "1.0", dependencies: [], compatibility: "ROVEXO 1.x", enabled: true, status: "published", updatedAt: now() },
    { id: "theme-studio-pro", name: "Theme Studio Pro", type: "official", version: "1.0", dependencies: ["mission-control"], compatibility: "ROVEXO 1.x", enabled: true, status: "published", updatedAt: now() },
    { id: "platform-studio", name: "Platform Studio", type: "official", version: "1.0", dependencies: ["mission-control"], compatibility: "ROVEXO 1.x", enabled: true, status: "published", updatedAt: now() },
    { id: "app-studio", name: "App Studio", type: "official", version: "1.0", dependencies: ["mission-control", "platform-studio"], compatibility: "ROVEXO 1.x", enabled: true, status: "published", updatedAt: now() },
  ];
}

function createDefaultRecoveryPoints(): AppStudioRecoveryPoint[] {
  return [
    { id: "rp-config", label: "Configuration baseline", type: "configuration", createdAt: now(), rollbackAvailable: true },
    { id: "rp-theme", label: "Theme baseline", type: "theme", createdAt: now(), rollbackAvailable: true },
  ];
}

function createDefaultNotificationAlerts(): AppStudioNotificationAlert[] {
  return [
    { id: "alert-1", title: "Platform healthy", message: "All core services operational", severity: "success", module: "system-health", timestamp: now(), acknowledged: true },
    { id: "alert-2", title: "Push notifications", message: "Configure web push keys for full delivery", severity: "warning", module: "notifications", timestamp: now(), acknowledged: false },
  ];
}
