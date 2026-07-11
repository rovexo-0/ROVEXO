import {
  createDefaultBannerManagerConfig,
  createDefaultHomepageBuilderConfig,
} from "@/lib/super-admin/mission-control/defaults";
import { createDefaultStudioProDocument } from "@/lib/platform-visual/studio-pro/defaults";
import type {
  MenuBuilderConfig,
  PlatformThemeTokens,
  PlatformVisualBundle,
  PlatformVisualHistoryEntry,
} from "@/lib/platform-visual/types";

export function createDefaultThemeTokens(): PlatformThemeTokens {
  return {
    primary: "var(--ds-color-primary)",
    primaryDeep: "var(--ds-color-primary-deep)",
    background: "var(--ds-color-background)",
    surface: "var(--ds-color-surface)",
    textPrimary: "var(--ds-color-text-primary)",
    textSecondary: "var(--ds-color-text-secondary)",
    radius: 16,
    fontScale: 1,
    shadow: 1,
  };
}

export function createDefaultMenuBuilderConfig(): MenuBuilderConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    bottomNav: [
      { id: "home", label: "Home", href: "/", icon: "home", enabled: true, order: 0 },
      { id: "search", label: "Browse", href: "/search", icon: "search", enabled: true, order: 1 },
      { id: "sell", label: "Sell", href: "/sell", icon: "sell", enabled: true, order: 2, featured: true },
      { id: "saved", label: "Inbox", href: "/messages", icon: "messages", enabled: true, order: 3 },
      { id: "account", label: "Profile", href: "/account", icon: "account", enabled: true, order: 4 },
    ],
    topNav: [],
    footerNav: [],
    accountNav: [],
    mobileNav: [],
    desktopNav: [],
  };
}

export function createDefaultVisualBundle(label = "ROVEXO Default"): PlatformVisualBundle {
  const homepageBuilder = createDefaultHomepageBuilderConfig();
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    label,
    theme: createDefaultThemeTokens(),
    homepageBuilder,
    banners: createDefaultBannerManagerConfig(),
    menus: createDefaultMenuBuilderConfig(),
    studioPro: createDefaultStudioProDocument(homepageBuilder),
  };
}

export function createDefaultVisualHistory(): PlatformVisualHistoryEntry[] {
  return [];
}
