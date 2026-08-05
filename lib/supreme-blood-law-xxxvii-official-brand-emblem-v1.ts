/**
 * ROVEXO ABSOLUTE BLOOD LAW XXXVII
 * OFFICIAL BRAND EMBLEM — MASTER IDENTITY SYSTEM
 *
 * STATUS: SUPREME | LOCKED | CERTIFIED | PRODUCTION READY
 *
 * The official RX emblem is the permanent master identity of the ROVEXO Platform.
 * ONE official production emblem. No alternative logos. No background variants.
 *
 * Composition: RX Monogram + Protective Hands + Premium 3D Metallic Finish +
 * ROVEXO Purple Identity + BUY • SELL • GROW
 *
 * Parent brand freeze: lib/brand/canonical-rx-3d-logo-freeze-v1.ts
 * Master assets: public/brand/canonical-rx/
 */

import { existsSync, readFileSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";
import {
  CANONICAL_LOGO_ENGINE_V1,
  CANONICAL_RX_FAVICON_SIZES,
  CANONICAL_RX_ICON_PATHS,
  CANONICAL_RX_LOGO_FULL,
  CANONICAL_RX_MASTER_FILE,
  CANONICAL_RX_PWA_SIZES,
  OFFICIAL_RX_EMBLEM_FORMATS,
  OFFICIAL_RX_EMBLEM_ICON_SIZES,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";
import {
  readUtf8SourceOrEmpty,
  shouldSoftFailBrandIntegrityAtRuntime,
  warnBrandIntegrityAndContinue,
} from "@/lib/startup/brand-integrity-runtime-v1";

export const SUPREME_BLOOD_LAW_XXXVII_OFFICIAL_BRAND_EMBLEM_V1 = {
  version: "1.0",
  bloodLaw: "XXXVII",
  name: "Official Brand Emblem — Master Identity System",
  status: "SUPREME_LOCKED_CERTIFIED_PRODUCTION_READY",
  supreme: true,
  locked: true,
  certified: true,
  productionReady: true,
  certifiedAt: "2026-07-25",
  equation:
    "ONE_PLATFORM = ONE_BRAND = ONE_EMBLEM = ONE_IDENTITY = ONE_MASTER_ASSET = ONE_BRAND_LANGUAGE",
  mission:
    "The official RX emblem is the permanent master identity of the ROVEXO Platform. There shall be ONE official production emblem.",

  composition: [
    "RX Monogram",
    "Protective Hands",
    "Premium 3D Metallic Finish",
    "ROVEXO Purple Identity",
    "BUY • SELL • GROW",
  ] as const,

  visualMeaning: {
    RX: "ROVEXO Identity",
    Hands: ["Trust", "Protection", "Marketplace", "Community", "Growth"],
    Purple: ["Innovation", "Technology", "Premium Marketplace"],
    slogan: "Platform Mission",
  } as const,

  designLanguage: [
    "Photorealistic",
    "Premium 3D",
    "Luxury Metallic Finish",
    "Crystal Purple",
    "Chrome Silver",
    "Soft Studio Lighting",
    "Premium Reflections",
    "Ultra High Resolution",
    "Perfect Geometry",
    "Symmetrical Composition",
  ] as const,

  officialColours: [
    "Primary Purple",
    "ROVEXO Purple",
    "Metallic Silver",
    "Graphite Black",
    "White",
  ] as const,

  transparentMaster: {
    background: "TRANSPARENT",
    formats: ["PNG", "SVG", "WEBP", "AVIF"] as const,
    forbidden: [
      "embedded background",
      "white canvas",
      "black canvas",
      "shadow outside the emblem",
    ] as const,
  } as const,

  masterSurfaces: [
    "Login",
    "Register",
    "Forgot Password",
    "Verify Email",
    "Reset Password",
    "Splash Screen",
    "PWA Icon",
    "Install Banner",
    "App Launcher",
    "Browser Manifest",
    "Favicon",
    "Apple Touch Icon",
    "Android Adaptive Icon",
    "Loading Screen",
    "Welcome Screen",
    "Empty States",
    "Authentication Pages",
    "Marketing Pages",
    "Documentation",
    "Emails",
    "Social Assets",
    "Brand Guidelines",
  ] as const,

  iconSizes: OFFICIAL_RX_EMBLEM_ICON_SIZES,

  brandSsotChain: [
    "Brand Identity",
    "Master RX Emblem",
    "Asset Generator",
    "Platform Assets",
  ] as const,

  prohibited: [
    "Alternative RX logos",
    "Flat redesigns",
    "Different hands",
    "Different typography",
    "Different purple",
    "Different metallic effects",
    "Different slogan placement",
    "Multiple brand identities",
    "Background baked into the logo",
    "Stretched or cropped versions",
  ] as const,

  permanentPrinciples: [
    "One Platform",
    "One Brand",
    "One Emblem",
    "One Identity",
    "One Master Asset",
    "One Brand Language",
    "Zero Duplicate Logos",
    "Zero Alternative Emblems",
    "Zero Background Variants",
    "Zero Brand Fragmentation",
  ] as const,

  masterAssetPaths: {
    png: CANONICAL_RX_MASTER_FILE,
    full: CANONICAL_RX_LOGO_FULL,
    webp: "/brand/canonical-rx/master-emblem-v1.webp",
    avif: "/brand/canonical-rx/master-emblem-v1.avif",
    svg: "/brand/canonical-rx/master-emblem-v1.svg",
  } as const,
} as const;

export type SupremeBloodLawXxxviiOfficialBrandEmblem =
  typeof SUPREME_BLOOD_LAW_XXXVII_OFFICIAL_BRAND_EMBLEM_V1;

export type OfficialBrandEmblemCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type OfficialBrandEmblemReport = {
  ok: boolean;
  locked: boolean;
  certified: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XXXVII";
  checks: OfficialBrandEmblemCheck[];
  errors: string[];
};

function projectPublic(...segments: string[]): string {
  return workspacePath("public", ...segments);
}

function projectRoot(...segments: string[]): string {
  return workspacePath(...segments);
}

function hasAlphaChannel(filePath: string): boolean {
  try {
    const buf = readFileSync(filePath);
    // PNG IHDR bit depth/color type at byte 25: color type 4 or 6 includes alpha
    if (buf.length < 26) return false;
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      const colorType = buf[25];
      return colorType === 4 || colorType === 6;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Certify Official Brand Emblem Master Identity (Blood Law XXXVII).
 * Fail closed — never substitute another logo.
 */
export function certifyOfficialBrandEmblemXxxvii(): OfficialBrandEmblemReport {
  const law = SUPREME_BLOOD_LAW_XXXVII_OFFICIAL_BRAND_EMBLEM_V1;
  const checks: OfficialBrandEmblemCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "locked",
    "Official Emblem Locked Supreme",
    law.supreme === true &&
      law.locked === true &&
      law.certified === true &&
      law.status === "SUPREME_LOCKED_CERTIFIED_PRODUCTION_READY",
    "Official brand emblem is not supreme / locked / certified",
  );

  add(
    "composition",
    "Official Emblem Composition Complete",
    law.composition.includes("RX Monogram") &&
      law.composition.includes("Protective Hands") &&
      law.composition.includes("BUY • SELL • GROW") &&
      law.composition.includes("ROVEXO Purple Identity"),
    "Official emblem composition incomplete",
  );

  add(
    "engine-aligned",
    "Canonical Logo Engine Aligned",
    CANONICAL_LOGO_ENGINE_V1.freezeLocked === true &&
      CANONICAL_LOGO_ENGINE_V1.background === "ABSOLUTE_TRANSPARENT" &&
      CANONICAL_LOGO_ENGINE_V1.display.includes("BUY • SELL • GROW") &&
      CANONICAL_LOGO_ENGINE_V1.composition.includes("Protective Hands"),
    "Canonical logo engine must declare transparent RX + Hands + slogan",
  );

  add(
    "transparent-formats",
    "Transparent Master Formats Present",
    OFFICIAL_RX_EMBLEM_FORMATS.every((fmt) => {
      const file =
        fmt === "PNG"
          ? projectPublic("brand", "canonical-rx", "rx-mark-v3.png")
          : fmt === "WEBP"
            ? projectPublic("brand", "canonical-rx", "master-emblem-v1.webp")
            : fmt === "AVIF"
              ? projectPublic("brand", "canonical-rx", "master-emblem-v1.avif")
              : projectPublic("brand", "canonical-rx", "master-emblem-v1.svg");
      return existsSync(file);
    }),
    "Master emblem must exist as PNG + SVG + WEBP + AVIF",
  );

  const masterPng = projectPublic("brand", "canonical-rx", "rx-mark-v3.png");
  const fullPng = projectPublic("brand", "canonical-rx", "logo-full-v3.png");
  const masterAlias = projectPublic("brand", "canonical-rx", "master-emblem-v1.png");
  add(
    "master-png-alpha",
    "Master PNG Has Transparent Alpha",
    existsSync(masterPng) && hasAlphaChannel(masterPng) && existsSync(masterAlias),
    "Master PNG must include an alpha channel (no baked background)",
  );

  add(
    "full-lockup-present",
    "Full Lockup Master Present",
    existsSync(fullPng) && hasAlphaChannel(fullPng),
    "logo-full-v3.png must exist with transparency",
  );

  add(
    "icon-matrix",
    "Required Icon Sizes Generated",
    OFFICIAL_RX_EMBLEM_ICON_SIZES.every((size) =>
      existsSync(projectPublic("icons", `icon-${size}.png`)),
    ) &&
      CANONICAL_RX_PWA_SIZES.every((size) =>
        existsSync(projectPublic("icons", `icon-${size}.png`)),
      ),
    "Required emblem icon sizes missing under public/icons",
  );

  add(
    "favicon-matrix",
    "Favicon Matrix Valid",
    CANONICAL_RX_FAVICON_SIZES.every((size) =>
      existsSync(projectPublic("icons", `favicon-${size}.png`)),
    ) && existsSync(projectPublic("favicon.ico")),
    "Favicon matrix incomplete",
  );

  add(
    "pwa-apple",
    "PWA / Apple Icons Valid",
    existsSync(projectPublic("icons", "icon-192.png")) &&
      existsSync(projectPublic("icons", "icon-512.png")) &&
      existsSync(projectPublic("icons", "icon-maskable-512.png")) &&
      existsSync(projectPublic("apple-icon.png")) &&
      existsSync(projectRoot("app", "apple-icon.png")) &&
      existsSync(projectRoot("app", "icon.png")),
    "PWA / Apple touch / app icons missing",
  );

  add(
    "manifest-paths",
    "Manifest Icon Paths Declared",
    CANONICAL_RX_ICON_PATHS.icon192 === "/icons/icon-192.png" &&
      CANONICAL_RX_ICON_PATHS.icon512 === "/icons/icon-512.png" &&
      CANONICAL_RX_MASTER_FILE === "/brand/canonical-rx/rx-mark-v3.png",
    "Manifest / master paths must stay on official emblem SSOT",
  );

  add(
    "auth-component",
    "Authentication Surfaces Consume Official Emblem Family",
    (() => {
      const brand = readUtf8SourceOrEmpty(
        projectRoot("components", "branding", "RovexoBrandLogo.tsx"),
      );
      if (!brand) return false;
      return (
        brand.includes("OFFICIAL_BRAND_PRIMARY_EMBLEM") &&
        (brand.includes("data-blood-law=\"XXXVIII\"") || brand.includes("data-blood-law=\"XXXVII\""))
      );
    })(),
    "RovexoBrandLogo must wire official Primary Emblem (Law XXXVIII application of XXXVII master)",
  );

  add(
    "no-manual-variations",
    "Brand SSOT Chain Declared",
    law.brandSsotChain.length === 4 && law.prohibited.includes("Alternative RX logos"),
    "Brand SSOT chain / prohibition incomplete",
  );

  const allPass = checks.every((c) => c.pass);

  return {
    ok: allPass,
    locked: allPass && law.locked,
    certified: allPass && law.certified,
    productionReady: allPass && law.productionReady,
    blocked: !allPass,
    bloodLaw: "XXXVII",
    checks,
    errors,
  };
}

export function assertOfficialBrandEmblemOrBlock(): void {
  const report = certifyOfficialBrandEmblemXxxvii();
  if (report.ok) return;
  if (shouldSoftFailBrandIntegrityAtRuntime()) {
    warnBrandIntegrityAndContinue("XXXVII", report.errors);
    return;
  }
  throw new Error(
    `[BLOOD LAW XXXVII] OFFICIAL BRAND EMBLEM CERTIFICATION FAILED — BLOCK RELEASE.\n` +
      report.errors.map((e) => ` - ${e}`).join("\n"),
  );
}

export function isOfficialBrandEmblemLocked(): boolean {
  return (
    SUPREME_BLOOD_LAW_XXXVII_OFFICIAL_BRAND_EMBLEM_V1.locked === true &&
    SUPREME_BLOOD_LAW_XXXVII_OFFICIAL_BRAND_EMBLEM_V1.supreme === true
  );
}
