import type { SearchEngineModule } from "@/lib/search-engine/types";

export const SEARCH_ENGINE_MODULES: SearchEngineModule[] = [
  { id: "global", label: "Global Search", icon: "🔍", description: "Unified marketplace discovery", href: "/search" },
  { id: "marketplace", label: "Marketplace Search", icon: "🛒", description: "Products, sellers, and stores", href: "/search" },
  { id: "listings", label: "Listings Search", icon: "🏷️", description: "Browse and filter listings", href: "/search" },
  { id: "category", label: "Category Search", icon: "📁", description: "Taxonomy and category browse", href: "/categories" },
  { id: "seller", label: "Seller Search", icon: "👤", description: "Find sellers and stores", href: "/search?q=seller" },
  { id: "business", label: "Business Search", icon: "🏢", description: "B2B business directory", href: "/business/directory" },
  { id: "brand", label: "Brand Search", icon: "✨", description: "Search by brand", href: "/search?q=brand" },
  { id: "location", label: "Location Search", icon: "📍", description: "Search by city and region", href: "/search?q=location" },
  { id: "services", label: "Services Search", icon: "🛠️", description: "Services marketplace", href: "/search?q=services" },
  { id: "orders-admin", label: "Orders Search (Admin)", icon: "📦", description: "Admin order lookup", href: "/super-admin/orders" },
  { id: "users-admin", label: "Users Search (Admin)", icon: "👥", description: "Admin user lookup", href: "/super-admin/users" },
  { id: "enterprise", label: "Enterprise Search", icon: "⚡", description: "Cross-module admin search", href: "/super-admin/search" },
  { id: "orders", label: "Orders Integration", icon: "📋", description: "Order search events", href: "/orders" },
  { id: "analytics", label: "Analytics Integration", icon: "📈", description: "Search metrics and reporting", href: "/analytics" },
  { id: "security", label: "Security Integration", icon: "🔒", description: "Search access control", href: "/security" },
  { id: "recovery", label: "Recovery Center", icon: "💾", description: "Index backup and restore", href: "/super-admin/recovery" },
];

export const SEARCH_ENGINE_MODULE_IDS = [
  { id: "global", label: "Global Search" },
  { id: "marketplace", label: "Marketplace Search" },
  { id: "listings", label: "Listings Search" },
  { id: "category", label: "Category Search" },
  { id: "seller", label: "Seller Search" },
  { id: "business", label: "Business Search" },
  { id: "brand", label: "Brand Search" },
  { id: "location", label: "Location Search" },
  { id: "services", label: "Services Search" },
  { id: "orders-admin", label: "Orders Search (Admin)" },
  { id: "users-admin", label: "Users Search (Admin)" },
  { id: "enterprise", label: "Enterprise Search" },
] as const;

export const SEARCH_ENGINE_TYPES = [
  { id: "instant", label: "Instant Search" },
  { id: "live", label: "Live Search" },
  { id: "autocomplete", label: "Autocomplete" },
  { id: "suggestions", label: "Suggestions" },
  { id: "fuzzy", label: "Fuzzy Search" },
  { id: "exact", label: "Exact Match" },
  { id: "keyword", label: "Keyword Search" },
  { id: "advanced", label: "Advanced Search" },
  { id: "voice", label: "Voice Search (Future)" },
  { id: "image", label: "Image Search (Future)" },
  { id: "semantic", label: "AI Semantic Search" },
] as const;

export const SEARCH_ENGINE_SORT_OPTIONS = [
  { id: "best-match", label: "Best Match" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "lowest-price", label: "Lowest Price" },
  { id: "highest-price", label: "Highest Price" },
  { id: "nearest", label: "Nearest" },
  { id: "most-popular", label: "Most Popular" },
  { id: "most-viewed", label: "Most Viewed" },
  { id: "best-rated", label: "Best Rated" },
  { id: "trending", label: "Trending" },
] as const;

export const SEARCH_ENGINE_INDEXES = [
  { id: "listings", label: "Listings Index" },
  { id: "category", label: "Category Index" },
  { id: "seller", label: "Seller Index" },
  { id: "business", label: "Business Index" },
  { id: "orders", label: "Orders Index" },
  { id: "users", label: "Users Index" },
  { id: "messages-admin", label: "Messages Index (Admin)" },
  { id: "analytics", label: "Analytics Index" },
] as const;

export function registerSearchEngineModule(module: SearchEngineModule): SearchEngineModule[] {
  const index = SEARCH_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...SEARCH_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...SEARCH_ENGINE_MODULES, module];
}
