/**
 * ROVEXO ABSOLUTE BLOOD LAW XXXVIII
 * OFFICIAL BRAND APPLICATION SYSTEM
 *
 * STATUS: LOCKED | CERTIFIED | PRODUCTION READY
 *
 * Every screen must use the correct brand asset according to its purpose.
 * The Brand System is part of the Design System.
 *
 * Parent: Blood Law XXXVII (Official Brand Emblem)
 * Registry: lib/brand/official-brand-application-v1.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";
import {
  readUtf8SourceOrEmpty,
  shouldSoftFailBrandIntegrityAtRuntime,
  warnBrandIntegrityAndContinue,
} from "@/lib/startup/brand-integrity-runtime-v1";
import {
  OFFICIAL_BRAND_APP_ICON,
  OFFICIAL_BRAND_ASSET_REGISTRY,
  OFFICIAL_BRAND_FAVICON_SOURCE,
  OFFICIAL_BRAND_LEVEL,
  OFFICIAL_BRAND_MASTER_EMBLEM,
  OFFICIAL_BRAND_PRIMARY_EMBLEM,
} from "@/lib/brand/official-brand-application-v1";
import {
  CANONICAL_RX_FAVICON_SIZES,
  CANONICAL_RX_ICON_PATHS,
  CANONICAL_RX_LOGO_LOGIN,
  CANONICAL_RX_PWA_SIZES,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

export const SUPREME_BLOOD_LAW_XXXVIII_OFFICIAL_BRAND_APPLICATION_V1 = {
  version: "1.0",
  bloodLaw: "XXXVIII",
  name: "Official Brand Application System",
  status: "LOCKED_CERTIFIED_PRODUCTION_READY",
  locked: true,
  certified: true,
  productionReady: true,
  certifiedAt: "2026-07-25",
  parentBloodLaw: "XXXVII",
  equation:
    "ONE_PLATFORM = ONE_BRAND = ONE_IDENTITY = ONE_BRAND_LANGUAGE = ONE_ASSET_REGISTRY",
  mission:
    "The Official ROVEXO Brand shall be applied consistently across the entire platform. Every screen must use the correct brand asset according to its purpose.",
  registry: OFFICIAL_BRAND_ASSET_REGISTRY,
  hierarchy: [
    {
      level: 1,
      name: "Master Emblem",
      composition: "RX + Protective Hands + BUY • SELL • GROW",
      asset: OFFICIAL_BRAND_MASTER_EMBLEM,
    },
    {
      level: 2,
      name: "Primary Emblem",
      composition: "RX + Protective Hands",
      asset: OFFICIAL_BRAND_PRIMARY_EMBLEM,
    },
    {
      level: 3,
      name: "App Icon",
      composition: "RX",
      asset: OFFICIAL_BRAND_APP_ICON,
    },
    {
      level: 4,
      name: "Favicon",
      composition: "Simplified RX",
      asset: OFFICIAL_BRAND_FAVICON_SOURCE,
    },
  ] as const,
  noSplashScreen: true,
  transparencyFormats: ["PNG", "SVG", "WEBP", "AVIF"] as const,
  forbidden: [
    "Stretch logo",
    "Compress logo",
    "Crop logo",
    "Rotate logo",
    "Add effects",
    "Change colours",
    "Add background",
    "Use unofficial logos",
    "Mix different logo versions",
    "Place the Hero logo in tiny UI elements",
    "Splash Screen",
  ] as const,
  permanentPrinciples: [
    "One Platform",
    "One Brand",
    "One Identity",
    "One Brand Language",
    "One Asset Registry",
    "Zero Duplicate Logos",
    "Zero Background Variants",
    "Zero Brand Fragmentation",
    "Zero Incorrect Logo Usage",
  ] as const,
} as const;

export type SupremeBloodLawXxxviiiOfficialBrandApplication =
  typeof SUPREME_BLOOD_LAW_XXXVIII_OFFICIAL_BRAND_APPLICATION_V1;

export type OfficialBrandApplicationCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type OfficialBrandApplicationReport = {
  ok: boolean;
  locked: boolean;
  certified: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XXXVIII";
  checks: OfficialBrandApplicationCheck[];
  errors: string[];
};

function projectPublic(...segments: string[]): string {
  return workspacePath("public", ...segments);
}

function projectRoot(...segments: string[]): string {
  return workspacePath(...segments);
}

function hasPngAlpha(filePath: string): boolean {
  try {
    const buf = readFileSync(filePath);
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

function publicFromUrl(url: string): string {
  return projectPublic(...url.replace(/^\//, "").split("/"));
}

/**
 * Certify Official Brand Application System (Blood Law XXXVIII).
 */
export function certifyOfficialBrandApplicationXxxviii(): OfficialBrandApplicationReport {
  const law = SUPREME_BLOOD_LAW_XXXVIII_OFFICIAL_BRAND_APPLICATION_V1;
  const registry = OFFICIAL_BRAND_ASSET_REGISTRY;
  const checks: OfficialBrandApplicationCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "locked",
    "Brand Application Locked",
    law.locked === true && law.status === "LOCKED_CERTIFIED_PRODUCTION_READY",
    "Brand Application System is not locked / certified",
  );

  add(
    "hierarchy-four-levels",
    "Four-Level Brand Hierarchy Declared",
    law.hierarchy.length === 4 &&
      registry.levels[OFFICIAL_BRAND_LEVEL.I_MASTER_EMBLEM] != null &&
      registry.levels[OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM] != null &&
      registry.levels[OFFICIAL_BRAND_LEVEL.III_APP_ICON] != null &&
      registry.levels[OFFICIAL_BRAND_LEVEL.IV_FAVICON] != null,
    "Official brand hierarchy must declare Levels I–IV",
  );

  for (const level of Object.values(OFFICIAL_BRAND_LEVEL)) {
    const entry = registry.levels[level];
    const pngPath = publicFromUrl(entry.png);
    const webpPath = publicFromUrl(entry.webp);
    const avifPath = publicFromUrl(entry.avif);
    const svgPath = publicFromUrl(entry.svg);
    add(
      `asset:${level}`,
      `Assets Present — ${entry.name}`,
      existsSync(pngPath) &&
        existsSync(webpPath) &&
        existsSync(avifPath) &&
        existsSync(svgPath) &&
        hasPngAlpha(pngPath),
      `Missing or non-transparent assets for ${entry.name}`,
    );
  }

  add(
    "auth-uses-primary",
    "Authentication Surfaces Use Primary Emblem",
    registry.surfaces.login === OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM &&
      registry.surfaces.register === OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM &&
      registry.surfaces.forgotPassword === OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM &&
      registry.surfaces.resetPassword === OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM &&
      registry.surfaces.verifyEmail === OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM &&
      CANONICAL_RX_LOGO_LOGIN === OFFICIAL_BRAND_PRIMARY_EMBLEM,
    "Login/Register/security pages must use Primary Emblem (Level II)",
  );

  add(
    "header-uses-app-icon",
    "Application UI Uses App Icon",
    registry.surfaces.header === OFFICIAL_BRAND_LEVEL.III_APP_ICON &&
      registry.surfaces.navigation === OFFICIAL_BRAND_LEVEL.III_APP_ICON &&
      registry.surfaces.pwa === OFFICIAL_BRAND_LEVEL.III_APP_ICON,
    "Header / navigation / PWA must use App Icon (Level III)",
  );

  add(
    "favicon-level-iv",
    "Favicon Uses Level IV Source",
    registry.surfaces.favicon === OFFICIAL_BRAND_LEVEL.IV_FAVICON &&
      CANONICAL_RX_FAVICON_SIZES.every((size) =>
        existsSync(projectPublic("icons", `favicon-${size}.png`)),
      ),
    "Favicon matrix must derive from Level IV simplified RX",
  );

  add(
    "no-splash",
    "No Splash Screen",
    law.noSplashScreen === true && registry.noSplashScreen === true,
    "ROVEXO v1.0 must not use a Splash Screen",
  );

  add(
    "primary-forbidden-in-app-chrome",
    "Primary Emblem Forbidden In App Chrome",
    registry.forbiddenSurfacesForPrimaryEmblem.includes("Header") &&
      registry.forbiddenSurfacesForPrimaryEmblem.includes("Search Bar") &&
      registry.forbiddenSurfacesForPrimaryEmblem.includes("Product Cards"),
    "Primary Emblem must not be used in headers / cards / chrome",
  );

  const brandLogo = readUtf8SourceOrEmpty(
    projectRoot("components", "branding", "RovexoBrandLogo.tsx"),
  );
  add(
    "auth-component-primary",
    "RovexoBrandLogo Wires Primary Emblem",
    Boolean(brandLogo) &&
      brandLogo.includes("OFFICIAL_BRAND_PRIMARY_EMBLEM") &&
      brandLogo.includes('data-blood-law="XXXVIII"') &&
      !brandLogo.includes("rovexo-brand-logo__tagline"),
    "Auth brand component must render Primary Emblem only (no CSS slogan duplicate)",
  );

  const header = readUtf8SourceOrEmpty(
    projectRoot("components", "header", "RovexoHeaderV2.tsx"),
  );
  const topbar = readUtf8SourceOrEmpty(projectRoot("components", "header", "RvxTopBar.tsx"));
  add(
    "header-component-app-icon",
    "Header Components Wire App Icon",
    Boolean(header) &&
      Boolean(topbar) &&
      header.includes("OFFICIAL_BRAND_APP_ICON") &&
      topbar.includes("OFFICIAL_BRAND_APP_ICON"),
    "Header / top bar must use App Icon — never Primary/Master Emblem",
  );

  add(
    "pwa-icons",
    "PWA Icons Present From App Icon Pipeline",
    CANONICAL_RX_PWA_SIZES.every((size) =>
      existsSync(projectPublic("icons", `icon-${size}.png`)),
    ) &&
      existsSync(projectPublic("icons", "icon-maskable-512.png")) &&
      CANONICAL_RX_ICON_PATHS.icon192 === "/icons/icon-192.png",
    "PWA icon matrix incomplete",
  );

  add(
    "manifest-apple",
    "Manifest / Apple Icons Valid",
    existsSync(projectPublic("apple-icon.png")) &&
      existsSync(projectRoot("app", "apple-icon.png")) &&
      existsSync(projectRoot("app", "icon.png")) &&
      existsSync(projectPublic("favicon.ico")),
    "Apple / app / favicon icons missing",
  );

  const allPass = checks.every((c) => c.pass);

  return {
    ok: allPass,
    locked: allPass && law.locked,
    certified: allPass && law.certified,
    productionReady: allPass && law.productionReady,
    blocked: !allPass,
    bloodLaw: "XXXVIII",
    checks,
    errors,
  };
}

export function assertOfficialBrandApplicationOrBlock(): void {
  const report = certifyOfficialBrandApplicationXxxviii();
  if (report.ok) return;
  if (shouldSoftFailBrandIntegrityAtRuntime()) {
    warnBrandIntegrityAndContinue("XXXVIII", report.errors);
    return;
  }
  throw new Error(
    `[BLOOD LAW XXXVIII] OFFICIAL BRAND APPLICATION CERTIFICATION FAILED — BLOCK RELEASE.\n` +
      report.errors.map((e) => ` - ${e}`).join("\n"),
  );
}
