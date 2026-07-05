import type { HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";
import { createDefaultThemeTokens } from "@/lib/platform-visual/defaults";
import type {
  CanvasNode,
  DesignTokensPro,
  StudioComponentDefinition,
  StudioTemplateDefinition,
  ThemeStudioProDocument,
  VisualCanvasDocument,
} from "@/lib/platform-visual/studio-pro/types";

export const STUDIO_COMPONENT_LIBRARY: StudioComponentDefinition[] = [
  { id: "header", label: "Header", category: "navigation", icon: "🔝", module: "mission-control", defaultWidth: 1200, defaultHeight: 72 },
  { id: "footer", label: "Footer", category: "navigation", icon: "🔚", module: "mission-control", defaultWidth: 1200, defaultHeight: 160 },
  { id: "search-bar", label: "Search Bar", category: "navigation", icon: "🔍", defaultWidth: 480, defaultHeight: 48 },
  { id: "hero-slider", label: "Hero Slider", category: "content", icon: "🎞️", module: "banners", defaultWidth: 1200, defaultHeight: 360 },
  { id: "category-rail", label: "Category Rail", category: "content", icon: "📁", module: "categories", defaultWidth: 1200, defaultHeight: 120 },
  { id: "product-card", label: "Product Card", category: "commerce", icon: "🏷️", module: "listings", defaultWidth: 220, defaultHeight: 280 },
  { id: "listing-card", label: "Listing Card", category: "commerce", icon: "📋", module: "listings", defaultWidth: 220, defaultHeight: 280 },
  { id: "auction-card", label: "Auction Card", category: "commerce", icon: "🔨", module: "auctions", defaultWidth: 240, defaultHeight: 300 },
  { id: "business-card", label: "Business Card", category: "commerce", icon: "🏢", module: "businesses", defaultWidth: 280, defaultHeight: 180 },
  { id: "wallet-card", label: "Wallet Card", category: "commerce", icon: "👛", module: "wallet", defaultWidth: 320, defaultHeight: 160 },
  { id: "profile-card", label: "Profile Card", category: "widgets", icon: "👤", module: "profile", defaultWidth: 280, defaultHeight: 120 },
  { id: "notification-card", label: "Notification Card", category: "widgets", icon: "🔔", module: "notifications", defaultWidth: 360, defaultHeight: 88 },
  { id: "ai-widget", label: "AI Widget", category: "widgets", icon: "🤖", module: "ai-manager", defaultWidth: 360, defaultHeight: 120 },
  { id: "empty-state", label: "Empty State", category: "content", icon: "🖼️", module: "premium-assets", defaultWidth: 480, defaultHeight: 240 },
  { id: "support-widget", label: "Support Widget", category: "widgets", icon: "🎧", module: "support", defaultWidth: 320, defaultHeight: 100 },
  { id: "statistics", label: "Statistics", category: "widgets", icon: "📊", module: "analytics", defaultWidth: 400, defaultHeight: 140 },
  { id: "chart", label: "Chart", category: "widgets", icon: "📈", module: "analytics", defaultWidth: 480, defaultHeight: 220 },
  { id: "button", label: "Button", category: "layout", icon: "🔘", defaultWidth: 140, defaultHeight: 44 },
  { id: "form", label: "Form", category: "layout", icon: "📝", defaultWidth: 400, defaultHeight: 240 },
  { id: "table", label: "Table", category: "layout", icon: "📑", defaultWidth: 640, defaultHeight: 280 },
  { id: "bottom-menu", label: "Bottom Menu", category: "navigation", icon: "📱", module: "menu-builder", defaultWidth: 390, defaultHeight: 72 },
];

export const STUDIO_TEMPLATE_LIBRARY: StudioTemplateDefinition[] = [
  { id: "homepage", label: "Homepage", pageType: "homepage", icon: "🏠", description: "Full marketplace homepage layout" },
  { id: "landing", label: "Landing Page", pageType: "landing", icon: "🚀", description: "Marketing landing page" },
  { id: "category", label: "Category Page", pageType: "category", icon: "📁", description: "Category browse template" },
  { id: "product", label: "Product Page", pageType: "product", icon: "🏷️", description: "Listing detail template" },
  { id: "seller-dashboard", label: "Seller Dashboard", pageType: "seller", icon: "🛍️", description: "Seller hub layout" },
  { id: "buyer-dashboard", label: "Buyer Dashboard", pageType: "buyer", icon: "🛒", description: "Buyer dashboard layout" },
  { id: "business", label: "Business Page", pageType: "business", icon: "🏢", description: "Business storefront" },
  { id: "support", label: "Support Page", pageType: "support", icon: "🎧", description: "Help centre layout" },
  { id: "checkout", label: "Checkout", pageType: "checkout", icon: "💳", description: "Checkout flow shell" },
  { id: "wallet", label: "Wallet", pageType: "wallet", icon: "👛", description: "Wallet overview" },
  { id: "orders", label: "Orders", pageType: "orders", icon: "📦", description: "Orders management" },
  { id: "messages", label: "Messages", pageType: "messages", icon: "💬", description: "Messaging layout" },
  { id: "profile", label: "Profile", pageType: "profile", icon: "👤", description: "User profile page" },
  { id: "custom", label: "Custom Page", pageType: "custom", icon: "✨", description: "Blank custom canvas" },
];

const SECTION_TYPE_MAP: Record<string, string> = {
  header: "header",
  search: "search-bar",
  "category-rail": "category-rail",
  "hero-slider": "hero-slider",
  "featured-listings": "listing-card",
  recommended: "product-card",
  "recently-listed": "product-card",
  "popular-auctions": "auction-card",
  "business-spotlight": "business-card",
  "continue-browsing": "product-card",
  footer: "footer",
  "bottom-navigation": "bottom-menu",
};

export function createDefaultDesignTokensPro(): DesignTokensPro {
  return {
    ...createDefaultThemeTokens(),
    typography: { fontFamily: "var(--ds-font-sans)", headingScale: 1, bodyScale: 1 },
    spacing: { unit: 4, sectionGap: 24 },
    animations: { duration: 300, easing: "ease-out" },
    transitions: { fast: 150, medium: 250 },
    breakpoints: { desktop: 1440, laptop: 1280, tablet: 834, android: 412, iphone: 390, ultrawide: 1920 },
    colorMode: "light",
    seasonalTheme: "default",
    buttons: { radius: 12, padding: 12 },
    icons: { size: 24 },
    cards: { radius: 16, shadow: 1 },
    containers: { maxWidth: 1440 },
  };
}

export function createDefaultCanvasDocument(): VisualCanvasDocument {
  return {
    nodes: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    snapGrid: 8,
    showGrid: true,
    showGuides: true,
    safeArea: true,
    selectedIds: [],
  };
}

export function canvasNodesFromHomepage(homepage: HomepageBuilderConfig): CanvasNode[] {
  return [...homepage.components]
    .sort((a, b) => a.order - b.order)
    .map((component, index) => {
      const type = SECTION_TYPE_MAP[component.id] ?? "product-card";
      const libraryItem = STUDIO_COMPONENT_LIBRARY.find((item) => item.id === type);
      return {
        id: `node-${component.id}`,
        type,
        label: component.label,
        x: 40,
        y: 40 + index * 120,
        width: component.style.width ?? libraryItem?.defaultWidth ?? 320,
        height: component.style.height ?? libraryItem?.defaultHeight ?? 120,
        rotation: component.style.rotation ?? 0,
        locked: false,
        hidden: !component.enabled,
        layer: index,
        style: {
          width: component.style.width,
          height: component.style.height,
          padding: component.style.padding,
          margin: component.style.margin,
          gap: component.style.gap,
          borderRadius: component.style.borderRadius,
          shadow: component.style.shadow,
          opacity: component.style.opacity,
          rotation: component.style.rotation,
          fontSize: component.style.fontSize,
          iconSize: component.style.iconSize,
          columns: component.style.columns,
          rows: component.style.rows,
        },
        visibility: {
          desktop: component.visibility.desktop,
          laptop: component.visibility.desktop,
          tablet: component.visibility.tablet,
          android: component.visibility.mobile,
          iphone: component.visibility.mobile,
          ultrawide: component.visibility.desktop,
        },
        linkedSectionId: component.id,
        published: component.published,
        archived: false,
      };
    });
}

export function createDefaultStudioProDocument(homepage?: HomepageBuilderConfig): ThemeStudioProDocument {
  const canvas = createDefaultCanvasDocument();
  if (homepage) {
    canvas.nodes = canvasNodesFromHomepage(homepage);
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    canvas,
    designTokens: createDefaultDesignTokensPro(),
    themeLibrary: [{ id: "live", name: "ROVEXO Live", status: "live", version: 1, updatedAt: new Date().toISOString() }],
    componentMarketplace: [],
    visualHistory: [],
    activeBreakpoint: "desktop",
    orientation: "portrait",
  };
}
