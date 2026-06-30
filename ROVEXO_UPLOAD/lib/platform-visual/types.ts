import type {
  BannerManagerConfig,
  HomepageBuilderComponent,
  HomepageBuilderConfig,
  HomepageComponentStyle,
} from "@/lib/super-admin/mission-control/types";

export type PlatformThemeTokens = {
  primary?: string;
  primaryDeep?: string;
  background?: string;
  surface?: string;
  textPrimary?: string;
  textSecondary?: string;
  radius?: number;
  fontScale?: number;
  shadow?: number;
};

export type MenuItemConfig = {
  id: string;
  label: string;
  href: string;
  icon: string;
  enabled: boolean;
  order: number;
  featured?: boolean;
};

export type MenuBuilderConfig = {
  version: number;
  updatedAt: string;
  bottomNav: MenuItemConfig[];
  topNav: MenuItemConfig[];
  footerNav: MenuItemConfig[];
  accountNav: MenuItemConfig[];
  mobileNav: MenuItemConfig[];
  desktopNav: MenuItemConfig[];
};

import type { ThemeStudioProDocument } from "@/lib/platform-visual/studio-pro/types";

export type PlatformVisualBundle = {
  version: number;
  updatedAt: string;
  label: string;
  theme: PlatformThemeTokens;
  homepageBuilder: HomepageBuilderConfig;
  banners: BannerManagerConfig;
  menus: MenuBuilderConfig;
  studioPro: ThemeStudioProDocument;
};

export type PlatformVisualHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle: PlatformVisualBundle;
  rollbackAvailable: boolean;
};

export type PlatformVisualConfig = {
  mode: "live" | "draft";
  updatedAt: string;
  theme: PlatformThemeTokens;
  homepageBuilder: HomepageBuilderConfig;
  banners: BannerManagerConfig;
  menus: MenuBuilderConfig;
  publishedSections: HomepageBuilderComponent[];
  shell: {
    header: HomepageBuilderComponent | null;
    search: HomepageBuilderComponent | null;
    footer: HomepageBuilderComponent | null;
    bottomNavigation: HomepageBuilderComponent | null;
  };
};

export type VisualAuditEntry = {
  administrator: string;
  time: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type { HomepageBuilderComponent, HomepageComponentStyle };
