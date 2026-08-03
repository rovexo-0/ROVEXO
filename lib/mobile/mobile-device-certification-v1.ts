/**
 * ROVEXO MOBILE DEVICE CERTIFICATION ENGINE v1.0
 *
 * STATUS: OWNER LOCK · MOBILE-FIRST RELEASE BLOCKER
 * HOST: http://localhost:3000 ONLY
 *
 * Desktop is secondary. Mobile is the release blocker.
 * Reuses Cross Browser mobile/tablet device descriptors (singularity) and
 * expands the page matrix with Sell · Settings · Review Bundle · Profile.
 *
 * FAIL CLOSED · NO commit · NO push · NO Preview · NO Production.
 */
import { CURSOR_LOCAL_ORIGIN } from "@/lib/preview/owner-preview-ssot";
import {
  CROSS_BROWSER_INTERNAL_PAD_X_PX,
  CROSS_BROWSER_PAGES,
  CROSS_BROWSER_PAD_CONTRACT,
  CROSS_BROWSER_TARGETS,
  type CrossBrowserTarget,
} from "@/lib/cross-browser/cross-browser-certification-engine-v1";

export const MOBILE_DEVICE_CERTIFICATION_ID = "MOBILE_DEVICE_CERTIFICATION_ENGINE" as const;
export const MOBILE_DEVICE_CERTIFICATION_VERSION = "v1.0" as const;
export const MOBILE_DEVICE_CERTIFICATION_STATUS =
  "OWNER LOCK · MOBILE-FIRST RELEASE BLOCKER" as const;
export const MOBILE_DEVICE_CERT_ORIGIN = CURSOR_LOCAL_ORIGIN;

export const MOBILE_DEVICE_PAD_CONTRACT = CROSS_BROWSER_PAD_CONTRACT;
export const MOBILE_DEVICE_INTERNAL_PAD_X_PX = CROSS_BROWSER_INTERNAL_PAD_X_PX;
export const MOBILE_DEVICE_TOUCH_MIN_PX = 44 as const;

export const MOBILE_DEVICE_EVIDENCE_DIR = "test-results/mobile-device-certification-v1";

export type MobileDevicePageId =
  | (typeof CROSS_BROWSER_PAGES)[number]["id"]
  | "profile"
  | "settings"
  | "sell"
  | "review_bundle";

export type MobileDevicePageSpec = {
  id: MobileDevicePageId;
  label: string;
  path: string;
  requiresAuth: boolean;
  softWhenEmpty: boolean;
};

/** Extra pages required by Mobile Device Certification (gaps vs Cross Browser). */
export const MOBILE_DEVICE_EXTRA_PAGES: readonly MobileDevicePageSpec[] = [
  {
    id: "profile",
    label: "Profile",
    path: "/account",
    requiresAuth: true,
    softWhenEmpty: false,
  },
  {
    id: "settings",
    label: "Settings",
    path: "/account/settings",
    requiresAuth: true,
    softWhenEmpty: false,
  },
  {
    id: "sell",
    label: "Sell",
    path: "/sell",
    requiresAuth: true,
    softWhenEmpty: false,
  },
  {
    id: "review_bundle",
    label: "Review Bundle",
    path: "/bundle/review",
    requiresAuth: true,
    softWhenEmpty: true,
  },
] as const;

/** Full mobile page matrix = Cross Browser pages + Owner mobile gaps. */
export const MOBILE_DEVICE_PAGES: readonly MobileDevicePageSpec[] = [
  ...CROSS_BROWSER_PAGES.map((page) => ({
    id: page.id as MobileDevicePageId,
    label: page.label,
    path: page.path,
    requiresAuth: page.requiresAuth,
    softWhenEmpty: page.softWhenEmpty,
  })),
  ...MOBILE_DEVICE_EXTRA_PAGES,
];

/** iPhone 15 Pro — required by Owner matrix (not only 15 / 15 Pro Max). */
export const MOBILE_DEVICE_IPHONE_15_PRO: CrossBrowserTarget = {
  id: "safari-ios-iphone-15-pro" as CrossBrowserTarget["id"],
  label: "Safari iOS · iPhone 15 Pro",
  family: "mobile",
  browserLabel: "Safari",
  deviceLabel: "iPhone 15 Pro",
  engine: "webkit",
  playwrightProject: "mdc-safari-ios-iphone-15-pro",
  executionMode: "emulated",
  playwrightDevice: "iPhone 15 Pro",
  orientationTests: true,
  limitations: ["WebKit + device descriptor — not a physical iPhone."],
};

/**
 * Mobile + tablet targets only (desktop excluded).
 * Reuses Cross Browser device descriptors; Playwright projects are `mdc-*`
 * (separate from `xcb-*` so both certifications can coexist in buildAllProjects).
 */
export const MOBILE_DEVICE_TARGETS: readonly CrossBrowserTarget[] = [
  ...CROSS_BROWSER_TARGETS.filter((t) => t.family === "mobile" || t.family === "tablet").map(
    (t) => ({
      ...t,
      playwrightProject: t.playwrightProject.replace(/^xcb-/, "mdc-"),
    }),
  ),
  MOBILE_DEVICE_IPHONE_15_PRO,
];

export const MOBILE_DEVICE_ORIENTATIONS = ["portrait", "landscape"] as const;

export const MOBILE_DEVICE_CERTIFICATION_CONTRACT = {
  id: MOBILE_DEVICE_CERTIFICATION_ID,
  version: MOBILE_DEVICE_CERTIFICATION_VERSION,
  status: MOBILE_DEVICE_CERTIFICATION_STATUS,
  origin: MOBILE_DEVICE_CERT_ORIGIN,
  mobileFirst: true,
  desktopSecondary: true,
  padLeftPx: MOBILE_DEVICE_PAD_CONTRACT.leftPx,
  padRightPx: MOBILE_DEVICE_PAD_CONTRACT.rightPx,
  touchMinPx: MOBILE_DEVICE_TOUCH_MIN_PX,
  noHorizontalScroll: true,
  noClippedContent: true,
  noStickyOverlap: true,
  noMobileConsoleErrors: true,
  mandatoryBeforePreviewRelease: true,
  pageCount: MOBILE_DEVICE_PAGES.length,
  deviceCount: MOBILE_DEVICE_TARGETS.length,
  forbidden: [
    "redesign",
    "feature_additions",
    "temporary_css",
    "magic_numbers",
    "weaken_tests",
    "commit",
    "push",
    "preview",
    "production",
  ] as const,
} as const;

export type MobileDeviceCellResult = "PASS" | "FAIL" | "SKIP" | "UNVERIFIED";

export type MobileDeviceEvidenceSnapshot = {
  version: typeof MOBILE_DEVICE_CERTIFICATION_VERSION;
  origin: string;
  generatedAt: string;
  overall: MobileDeviceCellResult;
  targets: Array<{
    id: string;
    label: string;
    playwrightProject: string;
    result: MobileDeviceCellResult;
    pages: Array<{
      id: string;
      label: string;
      result: MobileDeviceCellResult;
      defects: string[];
    }>;
    defects: string[];
    limitations: readonly string[];
  }>;
  defects: string[];
};

export function getMobileDevicePlaywrightProjectNames(): string[] {
  return MOBILE_DEVICE_TARGETS.map((t) => t.playwrightProject);
}

export function evaluateMobileDeviceCertification(
  evidence: MobileDeviceEvidenceSnapshot,
): { pass: boolean; defects: string[] } {
  const defects = [...evidence.defects];
  for (const target of evidence.targets) {
    if (target.result !== "PASS") {
      defects.push(`${target.label}: ${target.result}`);
    }
    for (const page of target.pages) {
      if (page.result === "FAIL") {
        defects.push(`${target.label} · ${page.label}: ${page.defects.join("; ") || "FAIL"}`);
      }
    }
  }
  return { pass: defects.length === 0 && evidence.overall === "PASS", defects };
}

export function assertMobileDeviceCertificationOrBlock(
  evidence: MobileDeviceEvidenceSnapshot,
): MobileDeviceEvidenceSnapshot {
  const { pass, defects } = evaluateMobileDeviceCertification(evidence);
  if (!pass) {
    throw new Error(
      `[MOBILE DEVICE CERTIFICATION] BLOCKED — ${defects.slice(0, 12).join(" | ")}${
        defects.length > 12 ? ` (+${defects.length - 12} more)` : ""
      }`,
    );
  }
  return evidence;
}

export function emptyMobileDeviceEvidence(): MobileDeviceEvidenceSnapshot {
  return {
    version: MOBILE_DEVICE_CERTIFICATION_VERSION,
    origin: MOBILE_DEVICE_CERT_ORIGIN,
    generatedAt: new Date().toISOString(),
    overall: "UNVERIFIED",
    targets: MOBILE_DEVICE_TARGETS.map((t) => ({
      id: t.id,
      label: t.label,
      playwrightProject: t.playwrightProject,
      result: "UNVERIFIED",
      pages: [],
      defects: ["No runtime evidence"],
      limitations: t.limitations,
    })),
    defects: ["Mobile Device Certification has not been executed"],
  };
}
