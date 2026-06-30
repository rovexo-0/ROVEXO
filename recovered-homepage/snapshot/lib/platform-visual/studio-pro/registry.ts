import type { StudioModuleRegistration } from "@/lib/platform-visual/studio-pro/types";

/** Future ROVEXO modules auto-register component types for Theme Studio Pro. */
export const STUDIO_MODULE_REGISTRY: StudioModuleRegistration[] = [
  { id: "mission-control", label: "Mission Control", icon: "🛰️", category: "platform", componentTypes: ["header", "footer"] },
  { id: "listings", label: "Listings", icon: "🏷️", category: "commerce", componentTypes: ["listing-card", "product-card"] },
  { id: "orders", label: "Orders", icon: "📦", category: "commerce", componentTypes: ["table", "statistics"] },
  { id: "payments", label: "Payments", icon: "💳", category: "commerce", componentTypes: ["wallet-card", "statistics"] },
  { id: "wallet", label: "Wallet", icon: "👛", category: "commerce", componentTypes: ["wallet-card"] },
  { id: "shipping", label: "Shipping", icon: "🚚", category: "commerce", componentTypes: ["statistics", "table"] },
  { id: "auctions", label: "Live Auctions", icon: "🔨", category: "commerce", componentTypes: ["auction-card"] },
  { id: "businesses", label: "Businesses", icon: "🏢", category: "commerce", componentTypes: ["business-card"] },
  { id: "messages", label: "Messages", icon: "💬", category: "people", componentTypes: ["notification-card"] },
  { id: "support", label: "Support", icon: "🎧", category: "people", componentTypes: ["support-widget"] },
  { id: "notifications", label: "Notifications", icon: "🔔", category: "platform", componentTypes: ["notification-card"] },
  { id: "ai-manager", label: "AI", icon: "🤖", category: "platform", componentTypes: ["ai-widget"] },
  { id: "analytics", label: "Analytics", icon: "📈", category: "insights", componentTypes: ["chart", "statistics"] },
  { id: "categories", label: "Categories", icon: "📁", category: "content", componentTypes: ["category-rail"] },
  { id: "banners", label: "Banners", icon: "🖼️", category: "content", componentTypes: ["hero-slider"] },
  { id: "premium-assets", label: "Premium Assets", icon: "✨", category: "content", componentTypes: ["empty-state"] },
  { id: "menu-builder", label: "Menus", icon: "🧭", category: "navigation", componentTypes: ["bottom-menu", "search-bar"] },
  { id: "developer", label: "Developer Tools", icon: "🛠️", category: "platform", componentTypes: ["table"] },
  { id: "profile", label: "Profile", icon: "👤", category: "people", componentTypes: ["profile-card"] },
];

export function registerStudioModule(module: StudioModuleRegistration): StudioModuleRegistration[] {
  const index = STUDIO_MODULE_REGISTRY.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...STUDIO_MODULE_REGISTRY];
    next[index] = module;
    return next;
  }
  return [...STUDIO_MODULE_REGISTRY, module];
}

export function getComponentsForModule(moduleId: string): string[] {
  return STUDIO_MODULE_REGISTRY.find((item) => item.id === moduleId)?.componentTypes ?? [];
}
