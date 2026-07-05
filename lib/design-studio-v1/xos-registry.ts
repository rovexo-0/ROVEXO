import type { XosModule } from "@/lib/design-studio-v1/types";

const XOS = "/super-admin/experience";

/** ROVEXO Experience Operating System — 37 enterprise modules. */
export const XOS_MODULES: XosModule[] = [
  { order: 1, id: "experience-center", label: "Experience Center", description: "Master control for every page, menu, screen, widget, and feature", href: XOS, icon: "🎛️", internal: true, capabilities: ["Overview", "Health", "Publish", "Audit"] },
  { order: 2, id: "navigation-manager", label: "Navigation Manager", description: "Desktop, mobile, sidebar, footer, breadcrumb, mega menu, quick actions", href: `${XOS}?tab=navigation`, icon: "🧭", internal: true, capabilities: ["Desktop Nav", "Mobile Nav", "Sidebar", "Footer", "Breadcrumb", "Mega Menu", "Drag & Drop"] },
  { order: 3, id: "screen-registry", label: "Screen Registry", description: "Auto-register every screen with version, scores, dependencies, owner", href: `${XOS}?tab=screens`, icon: "📱", internal: true, capabilities: ["Homepage", "Dashboards", "Checkout", "Admin", "CMS", "Error Pages"] },
  { order: 4, id: "visual-cms", label: "Visual CMS", description: "Complete visual editing with realtime preview — no code", href: "/super-admin/visual-cms", icon: "🖥️", capabilities: ["Homepage", "Dashboards", "CMS", "Landing", "Help", "Legal"] },
  { order: 5, id: "dynamic-layout-engine", label: "Dynamic Layout Engine", description: "Move, resize, hide, show, duplicate widgets and sections without code", href: "/super-admin/visual-cms?tab=canvas", icon: "📐", capabilities: ["Widgets", "Sections", "Columns", "Rows", "Containers"] },
  { order: 6, id: "homepage-builder", label: "Homepage Builder", description: "Visual homepage sections, category rail, listings feed", href: "/super-admin/homepage-builder", icon: "🏠", capabilities: ["Category Rail", "All Listings", "Hero", "Section Order"] },
  { order: 7, id: "dashboard-builder", label: "Dashboard Builder", description: "Buyer, seller, business dashboard layout builder", href: "/super-admin/platform-studio", icon: "📊", capabilities: ["Buyer", "Seller", "Business", "Wallet", "Shipping"] },
  { order: 8, id: "landing-builder", label: "Landing Builder", description: "Campaign and conversion landing pages", href: "/super-admin/platform-studio", icon: "🚀", capabilities: ["Campaign", "Conversion", "Hero", "CTA"] },
  { order: 9, id: "widget-builder", label: "Widget Builder", description: "Analytics, orders, wallet, shipping, revenue, messages widgets", href: `${XOS}?tab=widgets`, icon: "🧱", internal: true, capabilities: ["Analytics", "Orders", "Wallet", "Charts", "Calendar"] },
  { order: 10, id: "form-builder", label: "Form Builder", description: "Visual form builder for checkout, settings, and CMS", href: "/super-admin/workflows/builder", icon: "📝", capabilities: ["Inputs", "Validation", "Multi-step", "Preview"] },
  { order: 11, id: "component-builder", label: "Component Builder", description: "Versioned reusable cards, buttons, inputs, dialogs, tables", href: "/super-admin/visual-cms?tab=builders", icon: "🧩", capabilities: ["Cards", "Buttons", "Inputs", "Dialogs", "Modals", "Tables"] },
  { order: 12, id: "content-builder", label: "Content Builder", description: "CMS content blocks, help center, legal pages", href: "/super-admin/support", icon: "📄", capabilities: ["CMS Blocks", "Help Center", "Legal", "Static Pages"] },
  { order: 13, id: "localization-studio", label: "Localization Studio", description: "Languages, translations, currencies, timezone, RTL", href: "/super-admin/platform", icon: "🌍", capabilities: ["Languages", "Translations", "Currencies", "Timezone", "RTL"] },
  { order: 14, id: "responsive-studio", label: "Responsive Studio", description: "Desktop, tablet, mobile, PWA preview and validation", href: `${XOS}?tab=responsive`, icon: "📲", internal: true, capabilities: ["Desktop", "Tablet", "iPhone", "Android", "PWA", "Safe Area"] },
  { order: 15, id: "accessibility-center", label: "Accessibility Center", description: "WCAG validation, contrast, focus, screen reader audit", href: `${XOS}?tab=health`, icon: "♿", internal: true, capabilities: ["Contrast", "Focus Rings", "Alt Text", "ARIA", "WCAG AA"] },
  { order: 16, id: "motion-studio", label: "Motion Studio", description: "Page transitions, hover, micro-interactions", href: "/super-admin/premium-design", icon: "🎬", capabilities: ["Transitions", "Hover", "Loading", "Micro-interactions"] },
  { order: 17, id: "theme-studio", label: "Theme Studio", description: "Light, dark, automatic, seasonal themes", href: "/super-admin/theme-studio", icon: "🎨", capabilities: ["Light", "Dark", "Automatic", "Seasonal", "Accent"] },
  { order: 18, id: "brand-studio", label: "Brand Studio", description: "Logos, favicon, splash, brand guidelines", href: "/super-admin/assets/brand-kit", icon: "🏷️", capabilities: ["Logos", "Favicon", "Splash", "PWA", "Guidelines"] },
  { order: 19, id: "icon-studio", label: "Icon Studio", description: "Official icon families — clean, no backgrounds", href: `${XOS}?tab=icons`, icon: "◆", internal: true, capabilities: ["Navigation", "Dashboard", "Category", "3D", "SVG"] },
  { order: 20, id: "banner-studio", label: "Banner Studio", description: "Homepage, marketplace, campaign banners", href: "/super-admin/banners", icon: "🖼️", capabilities: ["Hero", "Marketplace", "Campaign", "Seasonal"] },
  { order: 21, id: "illustration-studio", label: "Illustration Studio", description: "Empty states, onboarding, promotions", href: "/super-admin/assets", icon: "🎭", capabilities: ["Empty States", "Onboarding", "Promotions"] },
  { order: 22, id: "animation-studio", label: "Animation Studio", description: "Logo, loading, splash animations", href: "/super-admin/premium-design", icon: "✨", capabilities: ["Logo", "Loading", "Splash", "Success", "Error"] },
  { order: 23, id: "asset-library", label: "Asset Library", description: "Single source of truth for all visual files", href: "/super-admin/assets", icon: "📦", capabilities: ["Icons", "Logos", "SVG", "PNG", "WEBP", "Lottie", "Fonts"] },
  { order: 24, id: "asset-scanner", label: "Asset Scanner", description: "Broken, missing, duplicate, legacy asset detection", href: `${XOS}?tab=assets`, icon: "🔍", internal: true, capabilities: ["Broken", "Missing", "404", "Unused", "Auto Repair"] },
  { order: 25, id: "asset-optimizer", label: "Asset Optimizer", description: "Compress, WEBP, SVG optimize, retina, cache", href: `${XOS}?tab=assets`, icon: "⚡", internal: true, capabilities: ["Compress", "WEBP", "SVG", "Retina", "Cache"] },
  { order: 26, id: "ai-design-guardian", label: "AI Design Guardian", description: "Detect wrong colors, spacing, icons, accessibility", href: `${XOS}?tab=guardian`, icon: "🛡️", internal: true, capabilities: ["Colors", "Spacing", "Icons", "A11y", "One-Click Fix"] },
  { order: 27, id: "brand-dna", label: "Brand DNA", description: "Canonical branding rules for every UI element", href: `${XOS}?tab=brand-dna`, icon: "🧬", internal: true, capabilities: ["Logo", "Typography", "Spacing", "Icons", "Motion"] },
  { order: 28, id: "dependency-graph", label: "Dependency Graph", description: "Impact analysis before any global replace", href: `${XOS}?tab=dependencies`, icon: "🕸️", internal: true, capabilities: ["Impact Analysis", "Prevent Breaking Changes"] },
  { order: 29, id: "global-search", label: "Global Search", description: "Search logo, button, page, widget, permission, asset", href: `${XOS}?tab=search`, icon: "🔎", internal: true, capabilities: ["Assets", "Components", "Pages", "Widgets", "Permissions"] },
  { order: 30, id: "global-replace-engine", label: "Global Replace Engine", description: "Replace component, icon, logo, theme globally", href: `${XOS}?tab=replace`, icon: "🔄", internal: true, capabilities: ["Icon", "Logo", "Banner", "Theme", "Widget"] },
  { order: 31, id: "publish-center", label: "Publish Center", description: "Preview, approve, schedule, publish with manifests", href: `${XOS}?tab=publish`, icon: "📡", internal: true, capabilities: ["Preview", "Approve", "Schedule", "Manifest", "Changelog"] },
  { order: 32, id: "rollback-center", label: "Rollback Center", description: "Restore previous experience versions", href: `${XOS}?tab=publish`, icon: "⏪", internal: true, capabilities: ["Rollback", "Compare", "Restore"] },
  { order: 33, id: "audit-center", label: "Audit Center", description: "Complete visual and experience audit", href: `${XOS}?tab=audit`, icon: "📋", internal: true, capabilities: ["Icons", "Navigation", "Responsive", "A11y", "Performance"] },
  { order: 34, id: "analytics-center", label: "Analytics Center", description: "Platform analytics and reporting", href: "/super-admin/analytics-engine", icon: "📈", capabilities: ["Traffic", "Conversion", "Revenue", "Reports"] },
  { order: 35, id: "experience-analytics", label: "Experience Analytics", description: "Clicks, scroll, heatmaps, navigation paths, funnels", href: `${XOS}?tab=analytics`, icon: "🔥", internal: true, capabilities: ["Heatmaps", "Navigation Paths", "Dead Clicks", "Funnels"] },
  { order: 36, id: "feature-toggle-center", label: "Feature Toggle Center", description: "Enable/disable modules, beta, seasonal, country features", href: `${XOS}?tab=features`, icon: "🚩", internal: true, capabilities: ["Modules", "Beta", "Seasonal", "Country", "Instant Publish"] },
  { order: 37, id: "permission-center", label: "Permission Center", description: "Role-based access for experience configuration", href: "/super-admin/security-engine", icon: "🔒", capabilities: ["Roles", "Permissions", "Admin Access", "Audit"] },
];

export function getXosModule(id: string): XosModule | undefined {
  return XOS_MODULES.find((m) => m.id === id);
}

/** Backward-compatible aliases */
export { XOS_MODULES as VOS_MODULES, XOS_MODULES as DESIGN_STUDIO_MODULES, getXosModule as getVosModule, getXosModule as getDesignStudioModule };
