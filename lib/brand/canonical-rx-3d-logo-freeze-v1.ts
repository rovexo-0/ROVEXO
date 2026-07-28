/**
 * ROVEXO v1.0 — CANONICAL LOGO ENGINE + ABSOLUTE BLOOD LAW XXXVII
 *
 * STATUS: OWNER APPROVED · SUPREME · LOCKED · FROZEN · CERTIFIED
 *
 * ONE OFFICIAL PRODUCTION EMBLEM ONLY:
 * RX Monogram + Protective Hands + Premium 3D Metallic Finish +
 * ROVEXO Purple Identity + BUY • SELL • GROW
 *
 * Transparent master only — no white/black/gradient plates, frames,
 * or shadows outside the emblem.
 *
 * Parent law: lib/supreme-blood-law-xxxvii-official-brand-emblem-v1.ts
 */

export const CANONICAL_LOGO_ENGINE_V1 = {
  version: "4.0",
  status: "LOCKED_FROZEN_CERTIFIED",
  ownerApprovedDesign: true,
  freezeLocked: true,
  bloodLaw: "XXXVII",
  law: "ONE_OFFICIAL_EMBLEM_ONLY",
  name: "OFFICIAL_RX_EMBLEM",
  display: ["RX", "BUY • SELL • GROW"] as const,
  composition: [
    "RX Monogram",
    "Protective Hands",
    "Premium 3D Metallic Finish",
    "ROVEXO Purple Identity",
    "BUY • SELL • GROW",
  ] as const,
  background: "ABSOLUTE_TRANSPARENT" as const,
  bloodCode: "OFFICIAL_BRAND_EMBLEM_XXXVII",
  loginScale: "COMPACT",
  loginCopy: "LOGO_ONLY_NO_WELCOME",
  quality: [
    "PREMIUM_3D",
    "TRANSPARENT_PNG",
    "PURPLE_PREMIUM",
    "CRYSTAL_X",
    "CHROME_SILVER_R",
    "METALLIC_HANDS",
    "ULTRA_HD",
    "RETINA",
    "PWA_READY",
    "PLATFORM_READY",
  ] as const,
  style: [
    "PREMIUM",
    "MODERN",
    "REALISTIC",
    "ULTRA_PREMIUM",
    "3D",
    "CRYSTAL_PURPLE",
    "CHROME_SILVER",
    "LUXURY_METALLIC",
    "GLOSS",
    "HIGH_DETAIL",
    "SYMMETRICAL",
  ] as const,
  forbiddenLooks: [
    "FLAT_DESIGN",
    "CARTOON",
    "ILLUSTRATION_ALTERNATE",
    "BLURRY",
    "PIXELATED",
    "BAKED_BACKGROUND",
    "ALTERNATE_EMBLEM",
  ] as const,
} as const;

/** Required export sizes from the same certified master (Law XXXVII). */
export const OFFICIAL_RX_EMBLEM_ICON_SIZES = [
  16, 32, 48, 64, 96, 128, 180, 192, 256, 384, 512, 1024,
] as const;

export const OFFICIAL_RX_EMBLEM_FORMATS = ["PNG", "SVG", "WEBP", "AVIF"] as const;

/** Full lockup — Level I Master Emblem (RX + Hands + BUY • SELL • GROW) */
export const CANONICAL_RX_LOGO_FULL = "/brand/canonical-rx/master-emblem-v1.png" as const;

/** Login / auth — Level II Primary Emblem (RX + Hands) — Law XXXVIII */
export const CANONICAL_RX_LOGO_LOGIN =
  "/brand/canonical-rx/primary-emblem-auth-v4.png" as const;

/** XXXVII certified master file (Level I alias — same as master-emblem-v1) */
export const CANONICAL_RX_MASTER_FILE = "/brand/canonical-rx/rx-mark-v3.png" as const;

/** Level III App Icon — headers / navigation / PWA source */
export const CANONICAL_RX_APP_ICON = "/brand/canonical-rx/app-icon-v1.png" as const;

/**
 * Compact RX mark for application chrome (Level III App Icon).
 * Prefer CANONICAL_RX_APP_ICON / OFFICIAL_BRAND_APP_ICON explicitly.
 */
export const CANONICAL_RX_MARK = CANONICAL_RX_APP_ICON;

/** Level IV favicon source */
export const CANONICAL_RX_FAVICON_SOURCE =
  "/brand/canonical-rx/favicon-rx-v1.png" as const;

/** Transparent format aliases (Level I master) */
export const OFFICIAL_RX_EMBLEM_WEBP = "/brand/canonical-rx/master-emblem-v1.webp" as const;
export const OFFICIAL_RX_EMBLEM_AVIF = "/brand/canonical-rx/master-emblem-v1.avif" as const;
export const OFFICIAL_RX_EMBLEM_SVG = "/brand/canonical-rx/master-emblem-v1.svg" as const;

/** @deprecated Splash removed — Cod Sânge v3 */
export const CANONICAL_RX_SPLASH_2048 = CANONICAL_RX_MASTER_FILE;

export const CANONICAL_RX_COLORS = {
  primaryPurple: "PRIMARY_PURPLE",
  rovexoPurple: "ROVEXO_PURPLE",
  metallicSilver: "METALLIC_SILVER",
  graphiteBlack: "GRAPHITE_BLACK",
  white: "WHITE",
  buy: "GRAPHITE_BLACK",
  sell: "ROVEXO_PURPLE",
  grow: "GRAPHITE_BLACK",
} as const;

export const CANONICAL_RX_FORBIDDEN_ASSET = [
  "WHITE_BACKGROUND",
  "BLACK_BACKGROUND",
  "GRADIENT_BACKGROUND",
  "SHADOWS_AROUND_LOGO",
  "FRAMES",
  "SQUARES",
  "CIRCLES",
  "FLAT_DESIGN",
  "ALTERNATE_LOGOS",
  "ALTERNATE_EMBLEMS",
  "BAKED_BACKGROUND",
  "STRETCHED_OR_CROPPED",
] as const;

export const CANONICAL_RX_PWA_SIZES = [
  16, 32, 48, 64, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024,
] as const;

export const CANONICAL_RX_FAVICON_SIZES = [16, 32, 48, 64] as const;

export const CANONICAL_RX_ICON_PATHS = {
  favicon16: "/icons/favicon-16.png",
  favicon32: "/icons/favicon-32.png",
  favicon48: "/icons/favicon-48.png",
  favicon64: "/icons/favicon-64.png",
  apple: "/apple-icon.png",
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png",
  maskable512: "/icons/icon-maskable-512.png",
  icon1024: "/icons/icon-1024.png",
} as const;

/** @deprecated alias — prefer CANONICAL_LOGO_ENGINE_V1 */
export const CANONICAL_RX_3D_LOGO_FREEZE = {
  version: CANONICAL_LOGO_ENGINE_V1.version,
  status: CANONICAL_LOGO_ENGINE_V1.status,
  ownerApproved: CANONICAL_LOGO_ENGINE_V1.ownerApprovedDesign,
  freezeApproved: CANONICAL_LOGO_ENGINE_V1.freezeLocked,
  name: CANONICAL_LOGO_ENGINE_V1.name,
  law: CANONICAL_LOGO_ENGINE_V1.law,
} as const;

/** @deprecated path aliases kept for existing imports */
export const CANONICAL_RX_3D_LOGO_FULL = CANONICAL_RX_LOGO_FULL;
export const CANONICAL_RX_3D_LOGO_LOGIN = CANONICAL_RX_LOGO_LOGIN;
export const CANONICAL_RX_3D_ICON_ONLY = CANONICAL_RX_MARK;
export const CANONICAL_RX_3D_ICON_PATHS = CANONICAL_RX_ICON_PATHS;
export const CANONICAL_RX_3D_COLORS = CANONICAL_RX_COLORS;
export const CANONICAL_RX_3D_FORBIDDEN = CANONICAL_RX_FORBIDDEN_ASSET;
export const CANONICAL_RX_3D_SURFACES = {
  login: { display: ["RX", "Protective Hands"] as const, asset: CANONICAL_RX_LOGO_LOGIN },
  splash: {
    display: CANONICAL_LOGO_ENGINE_V1.display,
    asset: CANONICAL_RX_SPLASH_2048,
    motion: ["ANIMATED_GLOW", "SLOW_LIGHT_MOVEMENT"] as const,
    authStartupUnchanged: true,
  },
  pwaIcon: { display: ["RX"] as const, asset: CANONICAL_RX_APP_ICON },
  favicon: { display: ["Simplified RX"] as const, asset: CANONICAL_RX_FAVICON_SOURCE },
  homepage: { display: ["RX"] as const, asset: CANONICAL_RX_APP_ICON },
  marketing: { display: CANONICAL_LOGO_ENGINE_V1.display, asset: CANONICAL_RX_LOGO_FULL },
} as const;
export const CANONICAL_RX_3D_EFFECTS = CANONICAL_LOGO_ENGINE_V1.style;
