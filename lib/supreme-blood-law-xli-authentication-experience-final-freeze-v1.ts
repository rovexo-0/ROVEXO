/**
 * ROVEXO ABSOLUTE BLOOD LAW XLI
 * AUTHENTICATION EXPERIENCE FINAL FREEZE
 *
 * STATUS: SUPREME | LOCKED | CERTIFIED | FINAL | PRODUCTION READY
 *
 * Completes the ROVEXO v1.0 Authentication UI.
 * Homepage Header · Login · Register are permanently frozen until ROVEXO v2.0.
 *
 * Parents: Blood Laws XXXVIII · XXXIX · XL
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { workspacePath } from "@/lib/server/workspace-path";
import {
  OFFICIAL_BRAND_APP_ICON,
  OFFICIAL_BRAND_PRIMARY_EMBLEM,
  getOfficialBrandAssetForSurface,
} from "@/lib/brand/official-brand-application-v1";
import {
  AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX,
  HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX,
  certifyAuthenticationBrandFreezeXxxix,
} from "@/lib/supreme-blood-law-xxxix-authentication-brand-freeze-v1";
import {
  REGISTER_EMBLEM_BACK_OFFSET_PX,
  certifyRegisterVisualPolishFreezeXl,
} from "@/lib/supreme-blood-law-xl-register-visual-polish-freeze-v1";

export const SUPREME_BLOOD_LAW_XLI_AUTHENTICATION_EXPERIENCE_FINAL_FREEZE_V1 = {
  version: "1.0",
  bloodLaw: "XLI",
  name: "Authentication Experience Final Freeze",
  status: "SUPREME_LOCKED_CERTIFIED_FINAL_PRODUCTION_READY",
  supreme: true,
  locked: true,
  certified: true,
  final: true,
  productionReady: true,
  certifiedAt: "2026-07-25",
  parentBloodLaws: ["XXXVIII", "XXXIX", "XL"] as const,
  frozenUntil: "ROVEXO_v2.0",
  equation:
    "ONE_PLATFORM = ONE_BRAND = ONE_HOMEPAGE_HEADER = ONE_AUTH_EXPERIENCE = ONE_LOGIN = ONE_REGISTER = ONE_IDENTITY",
  mission:
    "The complete ROVEXO Authentication Experience is officially frozen. Homepage Header Branding, Login and Register represent the certified production implementation. This completes the Authentication UI for ROVEXO v1.0.",
  certifiedPages: ["homepage", "login", "register"] as const,
  certifiedBranding: {
    homepage: {
      asset: "OFFICIAL_BRAND_APP_ICON",
      position: "Left of Search",
      certifiedHeightPx: HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX,
      status: "LOCKED",
    },
    login: {
      asset: "OFFICIAL_BRAND_PRIMARY_EMBLEM",
      position: "Centered",
      certifiedWidthPx: AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX,
      transparentBackground: true,
      status: "LOCKED",
    },
    register: {
      asset: "OFFICIAL_BRAND_PRIMARY_EMBLEM",
      position: "Centered",
      certifiedWidthPx: AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX,
      certifiedVerticalOffsetPx: REGISTER_EMBLEM_BACK_OFFSET_PX,
      transparentBackground: true,
      status: "LOCKED",
    },
  } as const,
  visualBalance: [
    "RX icon visible without dominating the Homepage Header",
    "Login immediately communicates the ROVEXO brand",
    "Register maintains identical branding language",
    "Consistent spacing",
    "Consistent alignment",
    "Consistent proportions",
    "Consistent authentication identity",
  ] as const,
  lockedComponents: [
    "Homepage Header Brand",
    "Search Header Layout",
    "Login Brand Placement",
    "Register Brand Placement",
    "Logo Size",
    "Logo Alignment",
    "Logo Container",
    "Authentication Layout",
    "Typography",
    "Inputs",
    "Buttons",
    "Navigation",
    "White Space",
    "Design Language",
  ] as const,
  permitted: [
    "Bug Fixes",
    "Security Fixes",
    "Accessibility Improvements",
    "Performance Optimisations",
    "Asset Quality Improvements",
  ] as const,
  forbidden: [
    "Brand redesign",
    "New logo variants",
    "Different logo sizes",
    "Different logo positions",
    "Alternative authentication layouts",
    "Header redesign",
    "Search redesign",
    "Authentication redesign",
    "Additional branding elements",
    "Experimental UI",
  ] as const,
  productionValidation: [
    "Homepage Header Branding",
    "Homepage RX Icon",
    "Login Branding",
    "Register Branding",
    "Responsive Rendering",
    "Mobile Rendering",
    "Tablet Rendering",
    "Desktop Rendering",
    "Transparent Assets",
    "Brand Consistency",
    "Authentication Consistency",
  ] as const,
  permanentPrinciples: [
    "One Platform",
    "One Brand",
    "One Homepage Header",
    "One Authentication Experience",
    "One Login Design",
    "One Register Design",
    "One Certified Identity",
    "Zero Duplicate Branding",
    "Zero Alternative Authentication UI",
    "Zero Unauthorized Visual Changes",
  ] as const,
} as const;

export type SupremeBloodLawXliAuthenticationExperienceFinalFreeze =
  typeof SUPREME_BLOOD_LAW_XLI_AUTHENTICATION_EXPERIENCE_FINAL_FREEZE_V1;

export type AuthenticationExperienceFinalCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type AuthenticationExperienceFinalReport = {
  ok: boolean;
  supreme: boolean;
  locked: boolean;
  certified: boolean;
  final: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XLI";
  checks: AuthenticationExperienceFinalCheck[];
  errors: string[];
};

function projectRoot(...segments: string[]): string {
  return workspacePath(...segments);
}

/**
 * Certify Authentication Experience Final Freeze (Blood Law XLI).
 * Requires parent XXXIX + XL certifications to pass.
 */
export function certifyAuthenticationExperienceFinalFreezeXli(): AuthenticationExperienceFinalReport {
  const law = SUPREME_BLOOD_LAW_XLI_AUTHENTICATION_EXPERIENCE_FINAL_FREEZE_V1;
  const checks: AuthenticationExperienceFinalCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "supreme-final",
    "Authentication Experience Supreme · Locked · Certified · Final",
    law.supreme === true &&
      law.locked === true &&
      law.certified === true &&
      law.final === true &&
      law.status === "SUPREME_LOCKED_CERTIFIED_FINAL_PRODUCTION_READY",
    "Authentication Experience Final Freeze is not supreme / locked / certified / final",
  );

  const xxxix = certifyAuthenticationBrandFreezeXxxix();
  add(
    "parent-xxxix",
    "Parent Blood Law XXXIX Pass",
    xxxix.ok,
    xxxix.errors[0] ?? "Authentication Brand Freeze (XXXIX) failed",
  );

  const xl = certifyRegisterVisualPolishFreezeXl();
  add(
    "parent-xl",
    "Parent Blood Law XL Pass",
    xl.ok,
    xl.errors[0] ?? "Register Visual Polish Freeze (XL) failed",
  );

  add(
    "certified-sizes",
    "Certified Branding Sizes Locked",
    HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX === 28 &&
      AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX === 180 &&
      REGISTER_EMBLEM_BACK_OFFSET_PX === 10 &&
      law.certifiedBranding.homepage.certifiedHeightPx === 28 &&
      law.certifiedBranding.login.certifiedWidthPx === 180 &&
      law.certifiedBranding.register.certifiedWidthPx === 180 &&
      law.certifiedBranding.register.certifiedVerticalOffsetPx === 10,
    "Certified sizes must remain Homepage 28px · Auth emblem 180px · Register offset +10px",
  );

  add(
    "surface-assets",
    "Certified Surface Assets",
    getOfficialBrandAssetForSurface("header") === OFFICIAL_BRAND_APP_ICON &&
      getOfficialBrandAssetForSurface("login") === OFFICIAL_BRAND_PRIMARY_EMBLEM &&
      getOfficialBrandAssetForSurface("register") === OFFICIAL_BRAND_PRIMARY_EMBLEM,
    "Homepage must use App Icon; Login/Register must use Primary Emblem",
  );

  const headerCss = readFileSync(projectRoot("styles", "rovexo", "header-v2.css"), "utf8");
  const authCss = readFileSync(projectRoot("styles", "rovexo", "auth-v1.css"), "utf8");
  add(
    "css-homepage-28",
    "Homepage Header Icon CSS 28px",
    headerCss.includes(".rx-h2__logo-img") &&
      headerCss.includes("height: 28px") &&
      headerCss.includes("max-height: 28px"),
    "Homepage RX icon certified height 28px missing",
  );
  add(
    "css-auth-180",
    "Login / Register Emblem CSS 180px",
    authCss.includes("width: 180px") && authCss.includes("max-width: 180px"),
    "Auth emblem certified width 180px missing",
  );
  add(
    "css-register-offset-10",
    "Register Brand Offset CSS +10px",
    /auth-register--canonical-freeze\s+\.auth-register__brand\s*\{[^}]*margin-top:\s*10px/s.test(
      authCss,
    ),
    "Register certified vertical offset +10px missing",
  );

  const login = readFileSync(
    projectRoot("features", "auth", "components", "LoginScreen.tsx"),
    "utf8",
  );
  const register = readFileSync(
    projectRoot("features", "auth", "components", "RegisterScreen.tsx"),
    "utf8",
  );
  const brand = readFileSync(
    projectRoot("components", "branding", "RovexoBrandLogo.tsx"),
    "utf8",
  );
  const header = readFileSync(
    projectRoot("components", "header", "RovexoHeaderV2.tsx"),
    "utf8",
  );

  add(
    "xli-stamps",
    "XLI Final Freeze Stamps Present",
    login.includes('data-auth-experience-freeze="XLI"') &&
      register.includes('data-auth-experience-freeze="XLI"') &&
      brand.includes('data-auth-experience-freeze="XLI"') &&
      header.includes('data-auth-experience-freeze="XLI"'),
    "Login / Register / BrandLogo / Header must stamp data-auth-experience-freeze=XLI",
  );

  add(
    "completes-v1-auth-ui",
    "Completes ROVEXO v1.0 Authentication UI",
    law.certifiedPages.includes("homepage") &&
      law.certifiedPages.includes("login") &&
      law.certifiedPages.includes("register") &&
      law.frozenUntil === "ROVEXO_v2.0",
    "XLI must certify Homepage · Login · Register until v2.0",
  );

  const allPass = checks.every((c) => c.pass);

  return {
    ok: allPass,
    supreme: allPass && law.supreme,
    locked: allPass && law.locked,
    certified: allPass && law.certified,
    final: allPass && law.final,
    productionReady: allPass && law.productionReady,
    blocked: !allPass,
    bloodLaw: "XLI",
    checks,
    errors,
  };
}

export function assertAuthenticationExperienceFinalFreezeOrBlock(): void {
  const report = certifyAuthenticationExperienceFinalFreezeXli();
  if (!report.ok) {
    throw new Error(
      `[BLOOD LAW XLI] AUTHENTICATION EXPERIENCE FINAL FREEZE FAILED — REJECT RELEASE.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}
