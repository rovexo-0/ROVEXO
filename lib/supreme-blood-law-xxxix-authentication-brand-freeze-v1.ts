/**
 * ROVEXO ABSOLUTE BLOOD LAW XXXIX
 * AUTHENTICATION BRAND FREEZE
 *
 * STATUS: LOCKED | CERTIFIED | FROZEN | PRODUCTION READY
 *
 * The Authentication visual identity is officially frozen.
 * Login + Register + Homepage header brand placement are production-certified.
 * Only maintenance and bug fixes are permitted — visual appearance must not change.
 *
 * Parent: Blood Law XXXVIII (Official Brand Application)
 * Frozen until: ROVEXO v2.0 (Owner-approved major version only)
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
  OFFICIAL_BRAND_LEVEL,
  OFFICIAL_BRAND_PRIMARY_EMBLEM,
  getOfficialBrandAssetForSurface,
} from "@/lib/brand/official-brand-application-v1";
import { CANONICAL_RX_LOGO_LOGIN } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

/** Certified Login / Register Primary Emblem rendered width (px). */
export const AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX = 180 as const;

/** Certified Homepage header App Icon rendered height (px). */
export const HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX = 28 as const;

export const SUPREME_BLOOD_LAW_XXXIX_AUTHENTICATION_BRAND_FREEZE_V1 = {
  version: "1.0",
  bloodLaw: "XXXIX",
  name: "Authentication Brand Freeze",
  status: "LOCKED_CERTIFIED_FROZEN_PRODUCTION_READY",
  locked: true,
  certified: true,
  frozen: true,
  productionReady: true,
  certifiedAt: "2026-07-25",
  parentBloodLaw: "XXXVIII",
  frozenUntil: "ROVEXO_v2.0",
  equation:
    "ONE_PLATFORM = ONE_AUTH_EXPERIENCE = ONE_BRAND = ONE_HOMEPAGE_ICON = ONE_LOGIN_EMBLEM = ONE_REGISTER_EMBLEM",
  mission:
    "The Authentication visual identity is officially frozen. Login and Register represent the certified ROVEXO authentication experience. Only maintenance and bug fixes are permitted.",
  frozenPages: ["login", "register"] as const,
  officialPlacement: {
    homepage: {
      asset: "OFFICIAL_BRAND_APP_ICON",
      level: OFFICIAL_BRAND_LEVEL.III_APP_ICON,
      position: "Left of Search Bar",
      certifiedHeightPx: HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX,
      status: "LOCKED",
    },
    login: {
      asset: "OFFICIAL_BRAND_PRIMARY_EMBLEM",
      level: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
      position: "Centered",
      certifiedWidthPx: AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX,
      status: "LOCKED",
    },
    register: {
      asset: "OFFICIAL_BRAND_PRIMARY_EMBLEM",
      level: OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
      position: "Centered · Aligned below Back navigation",
      certifiedWidthPx: AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX,
      status: "LOCKED",
    },
  } as const,
  lockedComponents: [
    "Authentication Layout",
    "Logo Position",
    "Logo Scale",
    "Search Header Branding",
    "Input Layout",
    "Button Layout",
    "Typography",
    "Form Hierarchy",
    "White Space",
    "Authentication Flow",
    "Navigation",
    "Design Language",
  ] as const,
  permitted: [
    "Bug Fixes",
    "Security Updates",
    "Accessibility Improvements",
    "Performance Optimisations",
    "Asset Quality Improvements",
  ] as const,
  forbidden: [
    "Logo redesign",
    "Different emblem",
    "Different icon",
    "Alternative authentication branding",
    "Different logo position",
    "Different logo scale",
    "Layout redesign",
    "Additional decorations",
    "Visual experiments",
    "Parallel authentication UI",
  ] as const,
  qualityGates: [
    "Homepage RX icon rendered correctly",
    "Login emblem rendered correctly",
    "Register emblem rendered correctly",
    "Transparent assets loaded",
    "Brand alignment preserved",
    "Responsive behaviour verified",
    "Mobile rendering verified",
    "Desktop rendering verified",
    "Authentication visual consistency verified",
  ] as const,
  permanentPrinciples: [
    "One Platform",
    "One Authentication Experience",
    "One Brand Identity",
    "One Certified Homepage Icon",
    "One Certified Login Emblem",
    "One Certified Register Emblem",
    "Zero Duplicate Authentication Designs",
    "Zero Brand Inconsistency",
    "Zero Unauthorized UI Changes",
  ] as const,
  certifiedAssets: {
    primaryEmblem: OFFICIAL_BRAND_PRIMARY_EMBLEM,
    appIcon: OFFICIAL_BRAND_APP_ICON,
  } as const,
} as const;

export type SupremeBloodLawXxxixAuthenticationBrandFreeze =
  typeof SUPREME_BLOOD_LAW_XXXIX_AUTHENTICATION_BRAND_FREEZE_V1;

export type AuthenticationBrandFreezeCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type AuthenticationBrandFreezeReport = {
  ok: boolean;
  locked: boolean;
  certified: boolean;
  frozen: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XXXIX";
  checks: AuthenticationBrandFreezeCheck[];
  errors: string[];
};

function projectRoot(...segments: string[]): string {
  return workspacePath(...segments);
}

function projectPublic(...segments: string[]): string {
  return workspacePath("public", ...segments);
}

function publicFromUrl(url: string): string {
  return projectPublic(...url.replace(/^\//, "").split("/"));
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

/**
 * Certify Authentication Brand Freeze (Blood Law XXXIX).
 */
export function certifyAuthenticationBrandFreezeXxxix(): AuthenticationBrandFreezeReport {
  const law = SUPREME_BLOOD_LAW_XXXIX_AUTHENTICATION_BRAND_FREEZE_V1;
  const checks: AuthenticationBrandFreezeCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "locked-frozen",
    "Authentication Brand Locked · Certified · Frozen",
    law.locked === true &&
      law.certified === true &&
      law.frozen === true &&
      law.status === "LOCKED_CERTIFIED_FROZEN_PRODUCTION_READY",
    "Authentication Brand Freeze is not locked / certified / frozen",
  );

  add(
    "surfaces-primary",
    "Login / Register Use Certified Primary Emblem",
    getOfficialBrandAssetForSurface("login") === OFFICIAL_BRAND_PRIMARY_EMBLEM &&
      getOfficialBrandAssetForSurface("register") === OFFICIAL_BRAND_PRIMARY_EMBLEM &&
      CANONICAL_RX_LOGO_LOGIN === OFFICIAL_BRAND_PRIMARY_EMBLEM &&
      OFFICIAL_BRAND_ASSET_REGISTRY.surfaces.login ===
        OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM &&
      OFFICIAL_BRAND_ASSET_REGISTRY.surfaces.register ===
        OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM,
    "Login/Register must use Official Primary Emblem (Level II)",
  );

  add(
    "homepage-app-icon",
    "Homepage Header Uses Certified App Icon",
    getOfficialBrandAssetForSurface("header") === OFFICIAL_BRAND_APP_ICON &&
      OFFICIAL_BRAND_ASSET_REGISTRY.surfaces.header ===
        OFFICIAL_BRAND_LEVEL.III_APP_ICON,
    "Homepage header must use Official RX App Icon (Level III)",
  );

  const primaryPng = publicFromUrl(OFFICIAL_BRAND_PRIMARY_EMBLEM);
  const appIconPng = publicFromUrl(OFFICIAL_BRAND_APP_ICON);
  add(
    "assets-present-transparent",
    "Certified Brand Assets Present With Transparency",
    existsSync(primaryPng) &&
      existsSync(appIconPng) &&
      hasPngAlpha(primaryPng) &&
      hasPngAlpha(appIconPng),
    "Certified Primary Emblem / App Icon missing or non-transparent",
  );

  const authCss = readUtf8SourceOrEmpty(projectRoot("styles", "rovexo", "auth-v1.css"));
  add(
    "login-register-scale",
    "Login / Register Emblem Certified Scale (180px)",
    Boolean(authCss) &&
      authCss.includes(".auth-login .rovexo-brand-logo.rovexo-brand-logo--auth") &&
      authCss.includes(".auth-register .rovexo-brand-logo.rovexo-brand-logo--auth") &&
      authCss.includes("width: 180px") &&
      authCss.includes("max-width: 180px"),
    "Auth emblem certified width 180px must remain in auth-v1.css",
  );

  const headerCss = readUtf8SourceOrEmpty(projectRoot("styles", "rovexo", "header-v2.css"));
  add(
    "homepage-icon-scale",
    "Homepage Header Icon Certified Scale (28px)",
    Boolean(headerCss) &&
      headerCss.includes(".rx-h2__logo-img") &&
      headerCss.includes("height: 28px") &&
      headerCss.includes("max-height: 28px"),
    "Homepage RX App Icon certified height 28px must remain in header-v2.css",
  );

  const login = readUtf8SourceOrEmpty(
    projectRoot("features", "auth", "components", "LoginScreen.tsx"),
  );
  const register = readUtf8SourceOrEmpty(
    projectRoot("features", "auth", "components", "RegisterScreen.tsx"),
  );
  add(
    "login-register-wire",
    "Login / Register Wire RovexoBrandLogo",
    Boolean(login) &&
      Boolean(register) &&
      login.includes("RovexoBrandLogo") &&
      login.includes('data-auth-brand-freeze="XXXIX"') &&
      register.includes("RovexoBrandLogo") &&
      register.includes('data-auth-brand-freeze="XXXIX"') &&
      login.includes("rovexo-brand-logo--auth") &&
      register.includes("rovexo-brand-logo--auth"),
    "Login/Register must render RovexoBrandLogo with XXXIX freeze stamp",
  );

  const brandLogo = readUtf8SourceOrEmpty(
    projectRoot("components", "branding", "RovexoBrandLogo.tsx"),
  );
  add(
    "brand-logo-primary-only",
    "Auth Brand Component Primary Emblem Only",
    Boolean(brandLogo) &&
      brandLogo.includes("OFFICIAL_BRAND_PRIMARY_EMBLEM") &&
      brandLogo.includes('data-auth-brand-freeze="XXXIX"') &&
      !brandLogo.includes("OFFICIAL_BRAND_APP_ICON") &&
      !brandLogo.includes("OFFICIAL_BRAND_MASTER_EMBLEM") &&
      !brandLogo.includes("rovexo-brand-logo__tagline"),
    "RovexoBrandLogo must stay Primary Emblem only under XXXIX",
  );

  const header = readUtf8SourceOrEmpty(
    projectRoot("components", "header", "RovexoHeaderV2.tsx"),
  );
  add(
    "header-app-icon-only",
    "Header Wires App Icon · Never Primary Emblem",
    Boolean(header) &&
      header.includes("OFFICIAL_BRAND_APP_ICON") &&
      header.includes('data-auth-brand-freeze="XXXIX"') &&
      !header.includes("OFFICIAL_BRAND_PRIMARY_EMBLEM") &&
      !header.includes("OFFICIAL_BRAND_MASTER_EMBLEM"),
    "RovexoHeaderV2 must use App Icon only under XXXIX",
  );

  add(
    "no-parallel-auth-ui",
    "No Parallel Authentication Brand UI",
    !login.includes("auth-v2") &&
      !register.includes("auth-v2") &&
      !login.includes("BrandLogoPro") &&
      !register.includes("BrandLogoPro"),
    "Parallel authentication brand UI is forbidden",
  );

  const allPass = checks.every((c) => c.pass);

  return {
    ok: allPass,
    locked: allPass && law.locked,
    certified: allPass && law.certified,
    frozen: allPass && law.frozen,
    productionReady: allPass && law.productionReady,
    blocked: !allPass,
    bloodLaw: "XXXIX",
    checks,
    errors,
  };
}

export function assertAuthenticationBrandFreezeOrBlock(): void {
  const report = certifyAuthenticationBrandFreezeXxxix();
  if (report.ok) return;
  if (shouldSoftFailBrandIntegrityAtRuntime()) {
    warnBrandIntegrityAndContinue("XXXIX", report.errors);
    return;
  }
  throw new Error(
    `[BLOOD LAW XXXIX] AUTHENTICATION BRAND FREEZE CERTIFICATION FAILED — REJECT RELEASE.\n` +
      report.errors.map((e) => ` - ${e}`).join("\n"),
  );
}
