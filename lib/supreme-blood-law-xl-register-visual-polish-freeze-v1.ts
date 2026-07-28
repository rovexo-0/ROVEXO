/**
 * ROVEXO ABSOLUTE BLOOD LAW XL
 * REGISTER VISUAL POLISH FREEZE
 *
 * STATUS: LOCKED | CERTIFIED | PRODUCTION READY
 *
 * Final visual polish for Register before permanent UI freeze.
 * Approved change only: Primary RX Emblem offset +8–12px downward
 * (breathing room between ← Back and emblem). Everything else locked.
 *
 * Parent: Blood Law XXXIX (Authentication Brand Freeze)
 * Target: /register ONLY
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { workspacePath } from "@/lib/server/workspace-path";
import {
  OFFICIAL_BRAND_PRIMARY_EMBLEM,
  getOfficialBrandAssetForSurface,
} from "@/lib/brand/official-brand-application-v1";
import { AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX } from "@/lib/supreme-blood-law-xxxix-authentication-brand-freeze-v1";

/** Certified vertical offset (px) between Back and Primary Emblem on Register. */
export const REGISTER_EMBLEM_BACK_OFFSET_PX = 10 as const;

export const SUPREME_BLOOD_LAW_XL_REGISTER_VISUAL_POLISH_FREEZE_V1 = {
  version: "1.0",
  bloodLaw: "XL",
  name: "Register Visual Polish Freeze",
  status: "LOCKED_CERTIFIED_PRODUCTION_READY",
  locked: true,
  certified: true,
  productionReady: true,
  certifiedAt: "2026-07-25",
  parentBloodLaw: "XXXIX",
  targetPage: "/register",
  approvedAdjustment: {
    only: "Primary RX Emblem vertical offset downward",
    offsetPxMin: 8,
    offsetPxMax: 12,
    offsetPxCertified: REGISTER_EMBLEM_BACK_OFFSET_PX,
    purpose: "Breathing room between ← Back and Official RX Emblem",
    logoSizeUnchanged: true,
    logoCentered: true,
  },
  doNotModify: [
    "Logo width",
    "Logo height",
    "Logo artwork",
    "Transparent background",
    "Authentication layout",
    "Input fields",
    "Buttons",
    "Typography",
    "Colors",
    "White space below the logo",
    "Form spacing",
    "Navigation",
    "Register flow",
    "Validation",
    "CSS outside the logo container",
  ] as const,
  finalStatus: {
    homepageHeader: "LOCKED",
    login: "LOCKED",
    register: "LOCKED_AFTER_THIS_POLISH",
    authenticationBrandSystem: "FINAL_FREEZE",
  } as const,
} as const;

export type SupremeBloodLawXlRegisterVisualPolishFreeze =
  typeof SUPREME_BLOOD_LAW_XL_REGISTER_VISUAL_POLISH_FREEZE_V1;

export type RegisterVisualPolishCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type RegisterVisualPolishReport = {
  ok: boolean;
  locked: boolean;
  certified: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XL";
  checks: RegisterVisualPolishCheck[];
  errors: string[];
};

function projectRoot(...segments: string[]): string {
  return workspacePath(...segments);
}

function publicFromUrl(url: string): string {
  return workspacePath("public", ...url.replace(/^\//, "").split("/"));
}

/**
 * Certify Register Visual Polish Freeze (Blood Law XL).
 */
export function certifyRegisterVisualPolishFreezeXl(): RegisterVisualPolishReport {
  const law = SUPREME_BLOOD_LAW_XL_REGISTER_VISUAL_POLISH_FREEZE_V1;
  const checks: RegisterVisualPolishCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "locked",
    "Register Visual Polish Locked · Certified",
    law.locked === true &&
      law.certified === true &&
      law.status === "LOCKED_CERTIFIED_PRODUCTION_READY",
    "Register Visual Polish Freeze is not locked / certified",
  );

  add(
    "register-primary",
    "Register Uses Certified Primary Emblem",
    getOfficialBrandAssetForSurface("register") === OFFICIAL_BRAND_PRIMARY_EMBLEM &&
      existsSync(publicFromUrl(OFFICIAL_BRAND_PRIMARY_EMBLEM)),
    "Register must keep Official Primary Emblem",
  );

  const authCss = readFileSync(projectRoot("styles", "rovexo", "auth-v1.css"), "utf8");

  add(
    "emblem-offset",
    "Register Brand Container Offset 10px (8–12px range)",
    /auth-register--canonical-freeze\s+\.auth-register__brand\s*\{[^}]*margin-top:\s*10px/s.test(
      authCss,
    ) &&
      REGISTER_EMBLEM_BACK_OFFSET_PX >= 8 &&
      REGISTER_EMBLEM_BACK_OFFSET_PX <= 12,
    "Register brand must use margin-top: 10px under canonical freeze",
  );

  add(
    "emblem-scale-unchanged",
    "Register Emblem Certified Width Unchanged (180px)",
    AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX === 180 &&
      authCss.includes(".auth-register .rovexo-brand-logo.rovexo-brand-logo--auth") &&
      authCss.includes("width: 180px") &&
      authCss.includes("max-width: 180px"),
    "Register emblem width must remain 180px",
  );

  const register = readFileSync(
    projectRoot("features", "auth", "components", "RegisterScreen.tsx"),
    "utf8",
  );
  add(
    "register-stamp",
    "Register Screen XL Polish Stamp",
    register.includes('data-register-visual-polish="XL"') &&
      register.includes("RovexoBrandLogo") &&
      register.includes("auth-register__brand") &&
      register.includes("AuthBackButton"),
    "RegisterScreen must stamp XL and keep Back + brand structure",
  );

  add(
    "login-untouched-offset",
    "Login Brand Has No XL Offset Rule",
    !/auth-login--canonical-freeze\s+\.auth-login__brand\s*\{[^}]*margin-top:\s*10px/s.test(
      authCss,
    ),
    "XL offset must not apply to Login",
  );

  const allPass = checks.every((c) => c.pass);

  return {
    ok: allPass,
    locked: allPass && law.locked,
    certified: allPass && law.certified,
    productionReady: allPass && law.productionReady,
    blocked: !allPass,
    bloodLaw: "XL",
    checks,
    errors,
  };
}

export function assertRegisterVisualPolishFreezeOrBlock(): void {
  const report = certifyRegisterVisualPolishFreezeXl();
  if (!report.ok) {
    throw new Error(
      `[BLOOD LAW XL] REGISTER VISUAL POLISH FREEZE CERTIFICATION FAILED — REJECT BUILD.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}
