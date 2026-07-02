import type { PlatformVisualBundle, PlatformVisualHistoryEntry } from "@/lib/platform-visual/types";
import type { StudioBreakpoint } from "@/lib/platform-visual/studio-pro/types";

export type VisualCmsBuilderId =
  | "homepage-builder"
  | "landing-page-builder"
  | "header-builder"
  | "footer-builder"
  | "desktop-navigation-builder"
  | "mobile-navigation-builder"
  | "search-bar-builder"
  | "hero-banner-builder"
  | "categories-builder"
  | "product-card-builder"
  | "listing-card-builder"
  | "seller-profile-builder"
  | "buyer-profile-builder"
  | "business-profile-builder"
  | "wallet-interface-builder"
  | "orders-interface-builder"
  | "checkout-builder"
  | "messages-builder"
  | "notifications-builder"
  | "empty-state-builder"
  | "modal-builder"
  | "dialog-builder"
  | "popup-builder"
  | "footer-links-builder"
  | "theme-variables-builder";

export type VisualCmsCanvasElementId =
  | "container"
  | "section"
  | "column"
  | "grid"
  | "flex-layout"
  | "text"
  | "button"
  | "card"
  | "form"
  | "search-bar"
  | "icon"
  | "svg"
  | "png"
  | "webp"
  | "jpg"
  | "gif"
  | "lottie"
  | "emoji"
  | "sticker"
  | "flag"
  | "logo"
  | "video"
  | "background-image"
  | "gradient"
  | "shadow"
  | "border"
  | "divider"
  | "spacer"
  | "html-block"
  | "markdown-block";

export type VisualCmsBuilder = {
  id: VisualCmsBuilderId;
  label: string;
  icon: string;
  description: string;
  href: string;
  category: "layout" | "commerce" | "account" | "system" | "theme";
};

export type VisualCmsCanvasElement = {
  id: VisualCmsCanvasElementId;
  label: string;
  icon: string;
  category: "layout" | "media" | "content" | "decoration";
};

export type VisualCmsPublishStage =
  | "draft"
  | "preview"
  | "compare-live"
  | "approve"
  | "published";

export type VisualCmsEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
  publishReference?: string;
};

export type VisualCmsEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: VisualCmsEngineDocument;
  rollbackAvailable: boolean;
};

export type VisualCmsEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  activeThemeLabel: string;
  publishStage: VisualCmsPublishStage;
  builders: { id: VisualCmsBuilderId; label: string; enabled: boolean }[];
  canvasElements: { id: VisualCmsCanvasElementId; label: string; enabled: boolean }[];
  pixelEditor: {
    width: boolean;
    height: boolean;
    padding: boolean;
    margin: boolean;
    gap: boolean;
    borderRadius: boolean;
    opacity: boolean;
    rotation: boolean;
    typography: boolean;
    alignment: boolean;
    zIndex: boolean;
    visibility: boolean;
    responsiveVisibility: boolean;
    hoverState: boolean;
    darkModeOverride: boolean;
    animation: boolean;
    transition: boolean;
    shadow: boolean;
    blur: boolean;
    backdropBlur: boolean;
  };
  componentLibrary: {
    duplicate: boolean;
    rename: boolean;
    group: boolean;
    lock: boolean;
    hide: boolean;
    archive: boolean;
    favorite: boolean;
    clone: boolean;
    export: boolean;
    import: boolean;
    templateSave: boolean;
  };
  performance: {
    optimizeImages: boolean;
    optimizeSvg: boolean;
    optimizeFonts: boolean;
    responsiveImages: boolean;
    lazyLoading: boolean;
    clsSafeRendering: boolean;
    productionBundles: boolean;
  };
  security: {
    superAdminPublish: boolean;
    superAdminRollback: boolean;
    superAdminDeleteThemes: boolean;
    superAdminGlobalLayout: boolean;
    superAdminAssetLibrary: boolean;
    superAdminThemeVariables: boolean;
    auditProtected: boolean;
  };
  integrations: Record<string, boolean>;
  previewBreakpoints: StudioBreakpoint[];
  futureReady: string[];
  auditLog: VisualCmsEngineAuditEntry[];
};

export type VisualCmsEngineDashboard = {
  designScore: number;
  buildersEnabled: number;
  canvasElementsEnabled: number;
  assetsIndexed: number;
  themesPublished: number;
  rollbackAvailable: boolean;
};

export type VisualCmsEngineAnalytics = {
  layoutBuilders: number;
  commerceBuilders: number;
  accountBuilders: number;
  systemBuilders: number;
  themeBuilders: number;
  performanceFeatures: number;
  securityFeatures: number;
};

export type VisualCmsEngineSnapshot = {
  scannedAt: string;
  builders: VisualCmsBuilder[];
  canvasElements: VisualCmsCanvasElement[];
  draft: VisualCmsEngineDocument;
  live: VisualCmsEngineDocument;
  history: VisualCmsEngineHistoryEntry[];
  visualBundle: PlatformVisualBundle;
  themeHistory: PlatformVisualHistoryEntry[];
};

export type VisualCmsEngineContext = {
  dashboard: VisualCmsEngineDashboard;
  publishStage: VisualCmsPublishStage;
  activeThemeLabel: string;
  scannedAt: string;
};
