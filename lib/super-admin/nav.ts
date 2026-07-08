import type { SuperAdminNavItem, SuperAdminNavSection } from "@/lib/super-admin/nav-types";



export type { SuperAdminNavItem, SuperAdminNavSection } from "@/lib/super-admin/nav-types";



/** UI Polish v1.0 — canonical super-admin navigation (no duplicates). */

/** Command Center sidebar — reference layout with real routes. */
export const COMMAND_CENTER_SIDEBAR_NAV: SuperAdminNavItem[] = [
  { href: "/super-admin", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/super-admin/visitors", label: "Live Monitor", icon: "radio", description: "LIVE" },
  { href: "/super-admin/users", label: "Users", icon: "users" },
  { href: "/super-admin/moderation", label: "Listings", icon: "tag" },
  { href: "/super-admin/marketplace/delete-all-listings", label: "Delete All Listings", icon: "trash-2", description: "Danger" },
  { href: "/super-admin/orders-engine", label: "Orders", icon: "package" },
  { href: "/super-admin/payments-engine", label: "Payments", icon: "credit-card" },
  { href: "/super-admin/resolution-engine", label: "Resolution", icon: "bot", description: "Automated" },
  { href: "/super-admin/messages-engine", label: "Messages", icon: "mail" },
  { href: "/super-admin/protection-engine", label: "Disputes", icon: "scale" },
  { href: "/super-admin/reviews", label: "Reviews", icon: "star" },
  { href: "/super-admin/analytics-engine", label: "Analytics", icon: "bar-chart-3" },
  { href: "/super-admin/security-engine", label: "Security", icon: "shield" },
  { href: "/super-admin/platform", label: "Settings", icon: "settings" },
  { href: "/super-admin/observability/omega", label: "Omega / Sentinel", icon: "hexagon" },
];

export const SUPER_ADMIN_PRIMARY_NAV: SuperAdminNavItem[] = [

  { href: "/super-admin/users", label: "Users", description: "Accounts & sessions", icon: "👤" },

  { href: "/super-admin/moderation", label: "Listings", description: "Moderation & marketplace listings", icon: "🏷️" },

  { href: "/super-admin/orders-engine", label: "Orders", description: "Order lifecycle", icon: "📦" },

  { href: "/super-admin/businesses", label: "Business", description: "Verified business accounts", icon: "🏢" },

  { href: "/super-admin/payments-engine", label: "Payments", description: "Payments & payouts", icon: "💳" },

  { href: "/super-admin/resolution-engine", label: "Resolution", description: "Automated resolution monitor", icon: "🤖" },

  { href: "/super-admin/shipping-engine", label: "Shipping", description: "Carriers & delivery rules", icon: "🚚" },

  { href: "/super-admin/promotions", label: "Promotion", description: "Boost & featured campaigns", icon: "📣" },

  { href: "/super-admin/theme-manager", label: "Theme Engine", description: "White & black themes", icon: "🌓" },

  { href: "/super-admin/assets", label: "Brand Center", description: "Logos, icons & brand system", icon: "🎨" },

  { href: "/super-admin/homepage-builder", label: "Homepage Manager", description: "Homepage sections & publish", icon: "🏠" },

  { href: "/super-admin/banners", label: "Banner Manager", description: "Hero campaigns & sliders", icon: "🖼️" },

  { href: "/super-admin/mobile-distribution", label: "Mobile App", description: "Android & iOS distribution", icon: "📱" },

  { href: "/super-admin/analytics", label: "Analytics", description: "Platform metrics", icon: "📈" },

  { href: "/super-admin/platform", label: "Settings", description: "Platform configuration", icon: "⚙️" },

];



export const SUPER_ADMIN_NAV: SuperAdminNavSection[] = [

  {

    id: "platform",

    title: "Platform",

    items: SUPER_ADMIN_PRIMARY_NAV,

  },

];



export function buildDevelopmentNavSection(): SuperAdminNavSection {

  return { id: "development", title: "Development", collapsible: true, items: [] };

}



export const SUPER_ADMIN_QUICK_LINKS = SUPER_ADMIN_PRIMARY_NAV;

