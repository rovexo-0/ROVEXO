/**
 * ROVEXO ACCESSIBILITY CERTIFICATION ENGINE v1.0
 *
 * STATUS: OWNER LOCK · WCAG 2.2 AA · ENTIRE PLATFORM
 * HOST: http://localhost:3000 ONLY
 *
 * Real accessibility certification — not Lighthouse-only.
 * Forbidden: fake PASS · hiding violations · disabling axe rules · skipping pages.
 *
 * FAIL CLOSED · NO commit · NO push · NO Preview · NO Production.
 */
import { CURSOR_LOCAL_ORIGIN } from "@/lib/preview/owner-preview-ssot";
import { MOBILE_DEVICE_PAGES } from "@/lib/mobile/mobile-device-certification-v1";

export const ACCESSIBILITY_CERTIFICATION_ID = "ACCESSIBILITY_CERTIFICATION_ENGINE" as const;
export const ACCESSIBILITY_CERTIFICATION_VERSION = "v1.0" as const;
export const ACCESSIBILITY_CERTIFICATION_STATUS =
  "OWNER LOCK · WCAG 2.2 AA · ENTIRE PLATFORM" as const;
export const ACCESSIBILITY_CERT_ORIGIN = CURSOR_LOCAL_ORIGIN;

export const ACCESSIBILITY_EVIDENCE_DIR = "test-results/accessibility-certification-v1";

/** axe-core tags for WCAG 2.2 AA (includes 2.0 / 2.1 AA ancestors). */
export const ACCESSIBILITY_AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

export const ACCESSIBILITY_TOUCH_MIN_PX = 44 as const;

export type AccessibilityPageSpec = {
  id: string;
  label: string;
  path: string;
  requiresAuth: boolean;
  softWhenEmpty: boolean;
};

/** Full platform page matrix for Accessibility Certification. */
export const ACCESSIBILITY_PAGES: readonly AccessibilityPageSpec[] = [
  ...MOBILE_DEVICE_PAGES.map((page) => ({
    id: page.id,
    label: page.label,
    path: page.path,
    requiresAuth: page.requiresAuth,
    softWhenEmpty: page.softWhenEmpty,
  })),
  {
    id: "login",
    label: "Login",
    path: "/login",
    requiresAuth: false,
    softWhenEmpty: false,
  },
  {
    id: "register",
    label: "Register",
    path: "/register",
    requiresAuth: false,
    softWhenEmpty: false,
  },
];

export const ACCESSIBILITY_AXES = [
  "axe_wcag_22_aa",
  "keyboard",
  "focus",
  "screen_reader_names",
  "aria",
  "forms",
  "colour_contrast",
  "touch_targets",
  "reduced_motion",
  "announcements",
] as const;

export const ACCESSIBILITY_CERTIFICATION_CONTRACT = {
  id: ACCESSIBILITY_CERTIFICATION_ID,
  version: ACCESSIBILITY_CERTIFICATION_VERSION,
  status: ACCESSIBILITY_CERTIFICATION_STATUS,
  origin: ACCESSIBILITY_CERT_ORIGIN,
  wcagTarget: "WCAG 2.2 AA",
  axeTags: ACCESSIBILITY_AXE_TAGS,
  pageCount: ACCESSIBILITY_PAGES.length,
  touchMinPx: ACCESSIBILITY_TOUCH_MIN_PX,
  mandatoryBeforePreviewRelease: true,
  forbidden: [
    "fake_pass",
    "hide_violations",
    "disable_axe_rules",
    "skip_pages",
    "redesign",
    "feature_changes",
    "business_logic_changes",
    "commit",
    "push",
    "preview",
    "production",
  ] as const,
} as const;

export type AccessibilityCellResult = "PASS" | "FAIL" | "SKIP" | "UNVERIFIED";

export type AccessibilityPageEvidence = {
  id: string;
  label: string;
  result: AccessibilityCellResult;
  defects: string[];
  axeViolationIds: string[];
};

export type AccessibilityEvidenceSnapshot = {
  version: typeof ACCESSIBILITY_CERTIFICATION_VERSION;
  origin: string;
  generatedAt: string;
  overall: AccessibilityCellResult;
  wcagTarget: "WCAG 2.2 AA";
  pages: AccessibilityPageEvidence[];
  keyboard: AccessibilityCellResult;
  focus: AccessibilityCellResult;
  reducedMotion: AccessibilityCellResult;
  defects: string[];
};

export function evaluateAccessibilityCertification(
  evidence: AccessibilityEvidenceSnapshot,
): { pass: boolean; defects: string[] } {
  const defects = [...evidence.defects];
  for (const page of evidence.pages) {
    if (page.result === "FAIL") {
      defects.push(`${page.label}: ${page.defects.join("; ") || "FAIL"}`);
    }
  }
  if (evidence.keyboard === "FAIL") defects.push("Keyboard navigation FAIL");
  if (evidence.focus === "FAIL") defects.push("Focus certification FAIL");
  if (evidence.reducedMotion === "FAIL") defects.push("Reduced motion FAIL");
  return {
    pass: defects.length === 0 && evidence.overall === "PASS",
    defects,
  };
}

export function assertAccessibilityCertificationOrBlock(
  evidence: AccessibilityEvidenceSnapshot,
): AccessibilityEvidenceSnapshot {
  const { pass, defects } = evaluateAccessibilityCertification(evidence);
  if (!pass) {
    throw new Error(
      `[ACCESSIBILITY CERTIFICATION] BLOCKED — ${defects.slice(0, 12).join(" | ")}${
        defects.length > 12 ? ` (+${defects.length - 12} more)` : ""
      }`,
    );
  }
  return evidence;
}

export function emptyAccessibilityEvidence(): AccessibilityEvidenceSnapshot {
  return {
    version: ACCESSIBILITY_CERTIFICATION_VERSION,
    origin: ACCESSIBILITY_CERT_ORIGIN,
    generatedAt: new Date().toISOString(),
    overall: "UNVERIFIED",
    wcagTarget: "WCAG 2.2 AA",
    pages: ACCESSIBILITY_PAGES.map((page) => ({
      id: page.id,
      label: page.label,
      result: "UNVERIFIED",
      defects: ["No runtime evidence"],
      axeViolationIds: [],
    })),
    keyboard: "UNVERIFIED",
    focus: "UNVERIFIED",
    reducedMotion: "UNVERIFIED",
    defects: ["Accessibility Certification has not been executed"],
  };
}
