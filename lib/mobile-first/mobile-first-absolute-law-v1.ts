/**
 * ROVEXO MOBILE FIRST ABSOLUTE ENGINEERING LAW v1.0
 *
 * STATUS: OWNER APPROVED · PERMANENT · EFFECTIVE IMMEDIATELY · NO EXCEPTIONS
 *
 * ROVEXO is a 100% Mobile First marketplace.
 * Mobile is the reference platform. Desktop is secondary (required, not primary).
 *
 * Desktop PASS + Mobile FAIL = FAIL until Mobile is corrected.
 * No PASS · FREEZE · CERTIFY without Mobile Certification.
 */

export const MOBILE_FIRST_ABSOLUTE_LAW_NAME =
  "ROVEXO MOBILE FIRST ABSOLUTE ENGINEERING LAW" as const;
export const MOBILE_FIRST_ABSOLUTE_LAW_VERSION = "1.0" as const;
export const MOBILE_FIRST_ABSOLUTE_LAW_STATUS =
  "OWNER APPROVED · PERMANENT · EFFECTIVE IMMEDIATELY · NO EXCEPTIONS" as const;

export const MOBILE_FIRST_ABSOLUTE_LAW_V1 = {
  id: "mobile-first-absolute-law-v1",
  version: MOBILE_FIRST_ABSOLUTE_LAW_VERSION,
  status: MOBILE_FIRST_ABSOLUTE_LAW_STATUS,
  approvedByOwner: true,
  permanent: true,
  locked: true,
  frozen: true,
  effectiveImmediately: true,
  noExceptions: true,

  equation:
    "MOBILE FIRST REFERENCE = iPhone Safari → iPhone Chrome → Android → PWA → Desktop SECONDARY" as const,

  referencePlatform: "MOBILE" as const,
  desktopPriority: "SECONDARY" as const,
  desktopCompatibilityRequired: true,

  /** Platform priority — lower index = higher priority. */
  platformPriority: [
    "iPhone Safari",
    "iPhone Chrome",
    "Android Chrome",
    "Samsung Internet",
    "PWA",
    "iPad Safari",
    "Desktop Chrome",
    "Desktop Edge",
    "Desktop Safari",
    "Desktop Firefox",
  ] as const,

  primaryReference: "iPhone Safari" as const,

  incompleteIf: [
    "WORKS_ONLY_ON_DESKTOP",
    "WORKS_ONLY_ON_WINDOWS",
  ] as const,

  certificationForbiddenWithout: "MOBILE_CERTIFICATION" as const,

  gatesBlockedUntilMobilePass: [
    "PASS",
    "FREEZE",
    "CERTIFY",
    "OWNER_CERTIFICATION",
  ] as const,

  failPolicy: {
    desktopPassMobileFail: "FAIL",
    until: "MOBILE_CORRECTED",
  } as const,

  auditClassificationRequired: [
    "Desktop",
    "Mobile",
    "Desktop + Mobile",
  ] as const,

  forbiddenAuditOutcome: "DESKTOP_ONLY_CERTIFICATION" as const,

  everyBugMustAnswer: "Can this happen ONLY on Mobile?" as const,
  ifMobileOnlyInvestigate: "MOBILE_FIRST" as const,

  everyNewModuleMustVerify: [
    "Touch",
    "Viewport",
    "Safe Area",
    "Dynamic Toolbar",
    "Keyboard",
    "visualViewport",
    "Orientation",
    "HEIC",
    "Camera",
    "Gallery",
    "Upload",
    "Scroll",
    "Swipe",
    "Sticky",
    "Bottom Navigation",
    "PWA",
    "Offline Restore",
    "Session Restore",
    "Cookies",
    "SameSite",
    "Storage",
    "IndexedDB",
    "localStorage",
    "Background Restore",
    "Memory",
    "Performance",
    "Battery",
  ] as const,

  mobileCertificationMandatory: [
    "iPhone Safari",
    "iPhone Chrome",
    "Android Chrome",
    "Samsung Internet",
    "PWA",
    "Landscape",
    "Portrait",
    "Keyboard Open",
    "Keyboard Closed",
    "Low Network",
    "4G",
    "Wi-Fi",
    "Image Upload",
    "Camera",
    "Gallery",
  ] as const,

  identityRule:
    "Identical Mobile and Desktop behaviour unless Owner explicitly approves platform-specific behaviour" as const,

  cursorMustNever: [
    "Treat Desktop as reference platform",
    "Certify Desktop-only PASS",
    "Freeze without Mobile Certification",
    "Ignore Mobile-only bugs in favour of Desktop",
    "Skip visualViewport / safe-area / keyboard / HEIC / PWA checks on new modules",
  ] as const,
} as const;

export type MobileFirstAbsoluteLawV1 = typeof MOBILE_FIRST_ABSOLUTE_LAW_V1;

/** Desktop PASS + Mobile FAIL → overall FAIL. */
export function resolveMobileFirstCertificationResult(input: {
  desktopPass: boolean;
  mobilePass: boolean;
}): "PASS" | "FAIL" {
  if (!input.mobilePass) return "FAIL";
  if (!input.desktopPass) return "FAIL";
  return "PASS";
}

/** Freeze / Owner PASS forbidden until Mobile Certification passes. */
export function assertMobileCertificationOrBlock(input: {
  mobileCertificationPass: boolean;
}): void {
  if (!input.mobileCertificationPass) {
    throw new Error(
      "MOBILE FIRST LAW: PASS / FREEZE / CERTIFY forbidden until Mobile Certification PASS.",
    );
  }
}
