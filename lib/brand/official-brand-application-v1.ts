/**
 * ROVEXO Official Brand Application — Asset Registry (Blood Law XXXVIII)
 *
 * Brand Identity → Master Emblem → Asset Registry → Auth / App / PWA / Production
 * No duplicate brand assets. No unofficial exports.
 */

export const OFFICIAL_BRAND_LEVEL = {
  I_MASTER_EMBLEM: "I_MASTER_EMBLEM",
  II_PRIMARY_EMBLEM: "II_PRIMARY_EMBLEM",
  III_APP_ICON: "III_APP_ICON",
  IV_FAVICON: "IV_FAVICON",
} as const;

export type OfficialBrandLevel =
  (typeof OFFICIAL_BRAND_LEVEL)[keyof typeof OFFICIAL_BRAND_LEVEL];

/** Level I — RX + Hands + BUY • SELL • GROW */
export const OFFICIAL_BRAND_MASTER_EMBLEM =
  "/brand/canonical-rx/master-emblem-v1.png" as const;

/** Level II — RX + Protective Hands (Authentication) */
export const OFFICIAL_BRAND_PRIMARY_EMBLEM =
  "/brand/canonical-rx/primary-emblem-auth-v4.png" as const;

/** Level III — RX only (Navigation / Headers / PWA) */
export const OFFICIAL_BRAND_APP_ICON = "/brand/canonical-rx/app-icon-v1.png" as const;

/** Level IV — Simplified RX (Favicon 16–48) */
export const OFFICIAL_BRAND_FAVICON_SOURCE =
  "/brand/canonical-rx/favicon-rx-v1.png" as const;

export const OFFICIAL_BRAND_ASSET_REGISTRY = {
  version: "1.0",
  bloodLaw: "XXXVIII",
  levels: {
    [OFFICIAL_BRAND_LEVEL.I_MASTER_EMBLEM]: {
      level: 1 as const,
      name: "Master Emblem",
      composition: ["RX", "Protective Hands", "BUY • SELL • GROW"] as const,
      purpose: [
        "Brand Identity",
        "Marketing",
        "Authentication Welcome Experience",
      ] as const,
      png: OFFICIAL_BRAND_MASTER_EMBLEM,
      webp: "/brand/canonical-rx/master-emblem-v1.webp",
      avif: "/brand/canonical-rx/master-emblem-v1.avif",
      svg: "/brand/canonical-rx/master-emblem-v1.svg",
      /** XXXVII alias paths (same Level I master bytes) */
      aliases: [
        "/brand/canonical-rx/rx-mark-v3.png",
        "/brand/canonical-rx/logo-full-v3.png",
      ] as const,
    },
    [OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM]: {
      level: 2 as const,
      name: "Primary Emblem",
      composition: ["RX", "Protective Hands"] as const,
      purpose: [
        "Authentication",
        "Account Verification",
        "Password Recovery",
        "Security Pages",
      ] as const,
      png: OFFICIAL_BRAND_PRIMARY_EMBLEM,
      webp: "/brand/canonical-rx/primary-emblem-auth-v4.webp",
      avif: "/brand/canonical-rx/primary-emblem-auth-v4.avif",
      svg: "/brand/canonical-rx/primary-emblem-auth-v4.svg",
    },
    [OFFICIAL_BRAND_LEVEL.III_APP_ICON]: {
      level: 3 as const,
      name: "App Icon",
      composition: ["RX"] as const,
      purpose: [
        "Navigation",
        "Headers",
        "PWA",
        "Browser",
        "Shortcuts",
        "Toolbar",
      ] as const,
      png: OFFICIAL_BRAND_APP_ICON,
      webp: "/brand/canonical-rx/app-icon-v1.webp",
      avif: "/brand/canonical-rx/app-icon-v1.avif",
      svg: "/brand/canonical-rx/app-icon-v1.svg",
    },
    [OFFICIAL_BRAND_LEVEL.IV_FAVICON]: {
      level: 4 as const,
      name: "Favicon",
      composition: ["Simplified RX"] as const,
      purpose: ["16px", "32px", "48px", "Browser Tabs", "Bookmarks", "Pinned Tabs"] as const,
      png: OFFICIAL_BRAND_FAVICON_SOURCE,
      webp: "/brand/canonical-rx/favicon-rx-v1.webp",
      avif: "/brand/canonical-rx/favicon-rx-v1.avif",
      svg: "/brand/canonical-rx/favicon-rx-v1.svg",
    },
  },
  surfaces: {
    login: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    register: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    forgotPassword: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    resetPassword: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    verifyEmail: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    emailConfirmation: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    accountVerification: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    marketing: OFFICIAL_BRAND_LEVEL.I_MASTER_EMBLEM,
    ogImage: OFFICIAL_BRAND_LEVEL.I_MASTER_EMBLEM,
    header: OFFICIAL_BRAND_LEVEL.III_APP_ICON,
    navigation: OFFICIAL_BRAND_LEVEL.III_APP_ICON,
    toolbar: OFFICIAL_BRAND_LEVEL.III_APP_ICON,
    pwa: OFFICIAL_BRAND_LEVEL.III_APP_ICON,
    appleTouch: OFFICIAL_BRAND_LEVEL.III_APP_ICON,
    favicon: OFFICIAL_BRAND_LEVEL.IV_FAVICON,
  },
  forbiddenSurfacesForPrimaryEmblem: [
    "Header",
    "Search Bar",
    "Navigation",
    "Product Cards",
    "Category Cards",
    "Buttons",
    "Footer",
  ] as const,
  noSplashScreen: true,
} as const;

export type OfficialBrandAssetRegistry = typeof OFFICIAL_BRAND_ASSET_REGISTRY;

export function getOfficialBrandAssetPath(level: OfficialBrandLevel): string {
  return OFFICIAL_BRAND_ASSET_REGISTRY.levels[level].png;
}

export function getOfficialBrandAssetForSurface(
  surface: keyof typeof OFFICIAL_BRAND_ASSET_REGISTRY.surfaces,
): string {
  const level = OFFICIAL_BRAND_ASSET_REGISTRY.surfaces[surface];
  return getOfficialBrandAssetPath(level);
}
