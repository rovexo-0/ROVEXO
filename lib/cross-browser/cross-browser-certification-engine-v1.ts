/**
 * ROVEXO CROSS BROWSER CERTIFICATION ENGINE v1.0
 *
 * STATUS: OWNER LOCK · MANDATORY BEFORE PREVIEW RELEASE
 * HOST: http://localhost:3000 ONLY (agent / CI certification)
 *
 * This is NOT a Chromium-only smoke test.
 * ROVEXO must behave identically across the supported browser × device matrix.
 *
 * Execution honesty:
 * - Desktop Chrome / Firefox / WebKit (Safari engine) = native Playwright browsers when installed.
 * - Desktop Edge = Chromium Desktop Edge profile; optional native `msedge` channel when available.
 * - Mobile Safari iOS / iPad Safari = WebKit + official Playwright device descriptors.
 * - Chrome iOS / Chrome Android / Samsung Internet = Chromium + device + UA (emulated engines).
 * - Physical-device Owner phone approval remains separate (Owner Preview Policy v3.0).
 *
 * FAIL CLOSED: never claim PASS without runtime evidence for every matrix cell.
 * NO commit · NO push · NO deploy from this engine.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CURSOR_LOCAL_ORIGIN } from "@/lib/preview/owner-preview-ssot";
import { INTERNAL_PAD_X_PX, HOMEPAGE_CONTENT_PAD_X_PX } from "@/lib/design-system/design-decision-001-internal-ui-v1.1";

export const CROSS_BROWSER_CERTIFICATION_ID = "CROSS_BROWSER_CERTIFICATION_ENGINE" as const;
export const CROSS_BROWSER_CERTIFICATION_VERSION = "v1.0" as const;
export const CROSS_BROWSER_CERTIFICATION_STATUS = "OWNER LOCK · MANDATORY BEFORE PREVIEW RELEASE" as const;
export const CROSS_BROWSER_CERT_ORIGIN = CURSOR_LOCAL_ORIGIN;

export const CROSS_BROWSER_INTERNAL_PAD_X_PX = INTERNAL_PAD_X_PX;
export const CROSS_BROWSER_HOMEPAGE_CONTENT_PAD_X_PX = HOMEPAGE_CONTENT_PAD_X_PX;

/** Design-system horizontal pad that every certified page must respect. */
export const CROSS_BROWSER_PAD_CONTRACT = {
  leftPx: 16,
  rightPx: 16,
  noHorizontalScroll: true,
  noOverflow: true,
  noClippedContent: true,
} as const;

export type CrossBrowserEngineId =
  | "chromium"
  | "firefox"
  | "webkit"
  | "chromium-edge"
  | "chromium-crios"
  | "chromium-samsung";

export type CrossBrowserExecutionMode =
  | "native"
  | "emulated"
  | "unavailable";

export type CrossBrowserFamily =
  | "desktop"
  | "mobile"
  | "tablet";

export type CrossBrowserTargetId =
  | "chrome-desktop"
  | "edge-desktop"
  | "firefox-desktop"
  | "safari-desktop"
  | "safari-ios-iphone-se"
  | "safari-ios-iphone-13"
  | "safari-ios-iphone-15"
  | "safari-ios-iphone-15-pro-max"
  | "safari-ios-iphone-latest"
  | "chrome-ios-iphone-15"
  | "chrome-ios-iphone-latest"
  | "chrome-android-pixel"
  | "chrome-android-samsung"
  | "chrome-android-fold"
  | "samsung-internet-galaxy"
  | "ipad-safari"
  | "android-tablet-chrome";

export type CrossBrowserPageId =
  | "homepage"
  | "search"
  | "categories"
  | "listing"
  | "view_item"
  | "seller_profile"
  | "buyer_profile"
  | "messages"
  | "offers"
  | "bundle"
  | "checkout"
  | "orders"
  | "wallet"
  | "tracking"
  | "notifications";

export type CrossBrowserVerifyAxis =
  | "rendering"
  | "hydration"
  | "css"
  | "spacing"
  | "typography"
  | "icons"
  | "cards"
  | "buttons"
  | "bottom_sheets"
  | "sticky_cta"
  | "sticky_bundle"
  | "bottom_navigation"
  | "header"
  | "footer"
  | "safe_areas"
  | "keyboard"
  | "orientation"
  | "landscape"
  | "portrait"
  | "dark"
  | "light"
  | "touch_targets"
  | "scroll"
  | "momentum_scroll"
  | "safari_rubber_band"
  | "keyboard_resize"
  | "viewport_resize"
  | "dynamic_island"
  | "notch"
  | "sheet_animations"
  | "console_errors"
  | "hydration_mismatch"
  | "browser_js_errors"
  | "layout_shift"
  | "infinite_render"
  | "duplicated_fetch"
  | "horizontal_overflow"
  | "pad_x_16";

export type CrossBrowserTarget = {
  id: CrossBrowserTargetId;
  label: string;
  family: CrossBrowserFamily;
  browserLabel: string;
  deviceLabel: string;
  engine: CrossBrowserEngineId;
  /** Playwright project name — must stay in sync with playwright-cross-browser-projects.mjs */
  playwrightProject: string;
  executionMode: CrossBrowserExecutionMode;
  playwrightDevice?: string;
  customViewport?: { width: number; height: number };
  userAgentOverride?: string;
  channel?: "msedge" | "chrome";
  orientationTests: boolean;
  limitations: readonly string[];
};

export type CrossBrowserPageSpec = {
  id: CrossBrowserPageId;
  label: string;
  /** Path template; dynamic segments resolved at runtime in the E2E helper. */
  path: string;
  requiresAuth: boolean;
  /** Soft routes may redirect or show empty/fail-closed without FAIL when inventory is empty. */
  softWhenEmpty: boolean;
};

export const CROSS_BROWSER_PAGES: readonly CrossBrowserPageSpec[] = [
  { id: "homepage", label: "Homepage", path: "/", requiresAuth: true, softWhenEmpty: false },
  { id: "search", label: "Search", path: "/search", requiresAuth: true, softWhenEmpty: false },
  {
    id: "categories",
    label: "Categories",
    path: "/search",
    requiresAuth: true,
    softWhenEmpty: false,
  },
  {
    id: "listing",
    label: "Listing",
    path: "/listing/:slug",
    requiresAuth: true,
    softWhenEmpty: true,
  },
  {
    id: "view_item",
    label: "View Item",
    path: "/listing/:slug",
    requiresAuth: true,
    softWhenEmpty: true,
  },
  {
    id: "seller_profile",
    label: "Seller Profile",
    path: "/user/:username",
    requiresAuth: true,
    softWhenEmpty: true,
  },
  {
    id: "buyer_profile",
    label: "Buyer Profile",
    path: "/account",
    requiresAuth: true,
    softWhenEmpty: false,
  },
  { id: "messages", label: "Messages", path: "/inbox", requiresAuth: true, softWhenEmpty: false },
  {
    id: "offers",
    label: "Offers",
    path: "/inbox",
    requiresAuth: true,
    softWhenEmpty: true,
  },
  {
    id: "bundle",
    label: "Bundle",
    path: "/inbox",
    requiresAuth: true,
    softWhenEmpty: true,
  },
  {
    id: "checkout",
    label: "Checkout",
    path: "/checkout",
    requiresAuth: true,
    softWhenEmpty: true,
  },
  { id: "orders", label: "Orders", path: "/orders", requiresAuth: true, softWhenEmpty: false },
  { id: "wallet", label: "Wallet", path: "/wallet", requiresAuth: true, softWhenEmpty: false },
  {
    id: "tracking",
    label: "Tracking",
    path: "/orders",
    requiresAuth: true,
    softWhenEmpty: true,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/inbox",
    requiresAuth: true,
    softWhenEmpty: false,
  },
] as const;

export const CROSS_BROWSER_VERIFY_AXES: readonly CrossBrowserVerifyAxis[] = [
  "rendering",
  "hydration",
  "css",
  "spacing",
  "typography",
  "icons",
  "cards",
  "buttons",
  "bottom_sheets",
  "sticky_cta",
  "sticky_bundle",
  "bottom_navigation",
  "header",
  "footer",
  "safe_areas",
  "keyboard",
  "orientation",
  "landscape",
  "portrait",
  "dark",
  "light",
  "touch_targets",
  "scroll",
  "momentum_scroll",
  "safari_rubber_band",
  "keyboard_resize",
  "viewport_resize",
  "dynamic_island",
  "notch",
  "sheet_animations",
  "console_errors",
  "hydration_mismatch",
  "browser_js_errors",
  "layout_shift",
  "infinite_render",
  "duplicated_fetch",
  "horizontal_overflow",
  "pad_x_16",
] as const;

const CHROME_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1";

const SAMSUNG_INTERNET_UA =
  "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/122.0.0.0 Mobile Safari/537.36";

export const CROSS_BROWSER_TARGETS: readonly CrossBrowserTarget[] = [
  {
    id: "chrome-desktop",
    label: "Chrome (latest) · Desktop",
    family: "desktop",
    browserLabel: "Chrome",
    deviceLabel: "Desktop",
    engine: "chromium",
    playwrightProject: "xcb-chrome-desktop",
    executionMode: "native",
    playwrightDevice: "Desktop Chrome",
    orientationTests: false,
    limitations: [],
  },
  {
    id: "edge-desktop",
    label: "Edge (latest) · Desktop",
    family: "desktop",
    browserLabel: "Edge",
    deviceLabel: "Desktop",
    engine: "chromium-edge",
    playwrightProject: "xcb-edge-desktop",
    executionMode: "native",
    playwrightDevice: "Desktop Edge",
    channel: "msedge",
    orientationTests: false,
    limitations: [
      "Native msedge channel used when installed; otherwise Chromium Desktop Edge profile.",
    ],
  },
  {
    id: "firefox-desktop",
    label: "Firefox (latest) · Desktop",
    family: "desktop",
    browserLabel: "Firefox",
    deviceLabel: "Desktop",
    engine: "firefox",
    playwrightProject: "xcb-firefox-desktop",
    executionMode: "native",
    playwrightDevice: "Desktop Firefox",
    orientationTests: false,
    limitations: [],
  },
  {
    id: "safari-desktop",
    label: "Safari (latest available) · Desktop",
    family: "desktop",
    browserLabel: "Safari",
    deviceLabel: "Desktop",
    engine: "webkit",
    playwrightProject: "xcb-safari-desktop",
    executionMode: "native",
    playwrightDevice: "Desktop Safari",
    orientationTests: false,
    limitations: [
      "Playwright WebKit engine — not Apple Safari.app binary on Linux CI.",
    ],
  },
  {
    id: "safari-ios-iphone-se",
    label: "Safari iOS · iPhone SE",
    family: "mobile",
    browserLabel: "Safari iOS",
    deviceLabel: "iPhone SE",
    engine: "webkit",
    playwrightProject: "xcb-safari-ios-iphone-se",
    executionMode: "emulated",
    playwrightDevice: "iPhone SE",
    orientationTests: true,
    limitations: [
      "WebKit + device descriptor — not a physical iPhone / real Mobile Safari process.",
    ],
  },
  {
    id: "safari-ios-iphone-13",
    label: "Safari iOS · iPhone 13",
    family: "mobile",
    browserLabel: "Safari iOS",
    deviceLabel: "iPhone 13",
    engine: "webkit",
    playwrightProject: "xcb-safari-ios-iphone-13",
    executionMode: "emulated",
    playwrightDevice: "iPhone 13",
    orientationTests: true,
    limitations: [
      "WebKit + device descriptor — not a physical iPhone / real Mobile Safari process.",
    ],
  },
  {
    id: "safari-ios-iphone-15",
    label: "Safari iOS · iPhone 15",
    family: "mobile",
    browserLabel: "Safari iOS",
    deviceLabel: "iPhone 15",
    engine: "webkit",
    playwrightProject: "xcb-safari-ios-iphone-15",
    executionMode: "emulated",
    playwrightDevice: "iPhone 15",
    orientationTests: true,
    limitations: [
      "WebKit + device descriptor — not a physical iPhone / real Mobile Safari process.",
    ],
  },
  {
    id: "safari-ios-iphone-15-pro-max",
    label: "Safari iOS · iPhone 15 Pro Max",
    family: "mobile",
    browserLabel: "Safari iOS",
    deviceLabel: "iPhone 15 Pro Max",
    engine: "webkit",
    playwrightProject: "xcb-safari-ios-iphone-15-pro-max",
    executionMode: "emulated",
    playwrightDevice: "iPhone 15 Pro Max",
    orientationTests: true,
    limitations: [
      "WebKit + device descriptor — Dynamic Island / notch via viewport metrics only.",
    ],
  },
  {
    id: "safari-ios-iphone-latest",
    label: "Safari iOS · Latest iPhone",
    family: "mobile",
    browserLabel: "Safari iOS",
    deviceLabel: "iPhone 17 Pro Max",
    engine: "webkit",
    playwrightProject: "xcb-safari-ios-iphone-latest",
    executionMode: "emulated",
    playwrightDevice: "iPhone 17 Pro Max",
    orientationTests: true,
    limitations: [
      "WebKit + device descriptor — Owner physical-device visual remains separate.",
    ],
  },
  {
    id: "chrome-ios-iphone-15",
    label: "Chrome iOS · iPhone 15",
    family: "mobile",
    browserLabel: "Chrome iOS",
    deviceLabel: "iPhone 15",
    engine: "chromium-crios",
    playwrightProject: "xcb-chrome-ios-iphone-15",
    executionMode: "emulated",
    playwrightDevice: "iPhone 15",
    userAgentOverride: CHROME_IOS_UA,
    orientationTests: true,
    limitations: [
      "Chromium + CriOS UA — real Chrome iOS uses WKWebView; engine parity is approximate.",
    ],
  },
  {
    id: "chrome-ios-iphone-latest",
    label: "Chrome iOS · Latest iPhone",
    family: "mobile",
    browserLabel: "Chrome iOS",
    deviceLabel: "iPhone 17 Pro Max",
    engine: "chromium-crios",
    playwrightProject: "xcb-chrome-ios-iphone-latest",
    executionMode: "emulated",
    playwrightDevice: "iPhone 17 Pro Max",
    userAgentOverride: CHROME_IOS_UA,
    orientationTests: true,
    limitations: [
      "Chromium + CriOS UA — real Chrome iOS uses WKWebView; engine parity is approximate.",
    ],
  },
  {
    id: "chrome-android-pixel",
    label: "Chrome Android · Pixel",
    family: "mobile",
    browserLabel: "Chrome Android",
    deviceLabel: "Pixel 7",
    engine: "chromium",
    playwrightProject: "xcb-chrome-android-pixel",
    executionMode: "emulated",
    playwrightDevice: "Pixel 7",
    orientationTests: true,
    limitations: ["Device emulation — not a physical Pixel."],
  },
  {
    id: "chrome-android-samsung",
    label: "Chrome Android · Samsung Galaxy",
    family: "mobile",
    browserLabel: "Chrome Android",
    deviceLabel: "Galaxy S24",
    engine: "chromium",
    playwrightProject: "xcb-chrome-android-samsung",
    executionMode: "emulated",
    playwrightDevice: "Galaxy S24",
    orientationTests: true,
    limitations: ["Device emulation — not a physical Samsung Galaxy."],
  },
  {
    id: "chrome-android-fold",
    label: "Chrome Android · Foldable",
    family: "mobile",
    browserLabel: "Chrome Android",
    deviceLabel: "Galaxy Z Fold 7",
    engine: "chromium",
    playwrightProject: "xcb-chrome-android-fold",
    executionMode: "emulated",
    playwrightDevice: "Galaxy Z Fold 7",
    orientationTests: true,
    limitations: ["Foldable cover/inner layout approximated by Playwright descriptor."],
  },
  {
    id: "samsung-internet-galaxy",
    label: "Samsung Internet · Galaxy",
    family: "mobile",
    browserLabel: "Samsung Internet",
    deviceLabel: "Galaxy S24",
    engine: "chromium-samsung",
    playwrightProject: "xcb-samsung-internet-galaxy",
    executionMode: "emulated",
    playwrightDevice: "Galaxy S24",
    userAgentOverride: SAMSUNG_INTERNET_UA,
    orientationTests: true,
    limitations: [
      "Chromium + SamsungBrowser UA — not the real Samsung Internet binary.",
    ],
  },
  {
    id: "ipad-safari",
    label: "iPad Safari",
    family: "tablet",
    browserLabel: "Safari iPadOS",
    deviceLabel: "iPad Pro 11",
    engine: "webkit",
    playwrightProject: "xcb-ipad-safari",
    executionMode: "emulated",
    playwrightDevice: "iPad Pro 11",
    orientationTests: true,
    limitations: ["WebKit + iPad descriptor — not a physical iPad."],
  },
  {
    id: "android-tablet-chrome",
    label: "Android Tablet Chrome",
    family: "tablet",
    browserLabel: "Chrome Android",
    deviceLabel: "Galaxy Tab S9",
    engine: "chromium",
    playwrightProject: "xcb-android-tablet-chrome",
    executionMode: "emulated",
    playwrightDevice: "Galaxy Tab S9",
    orientationTests: true,
    limitations: ["Device emulation — not a physical Android tablet."],
  },
] as const;

export const CROSS_BROWSER_MATRIX_CELL_COUNT =
  CROSS_BROWSER_TARGETS.length * CROSS_BROWSER_PAGES.length;

export const CROSS_BROWSER_EVIDENCE_DIR =
  "test-results/cross-browser-certification-v1" as const;

export const CROSS_BROWSER_MATRIX_JSON =
  `${CROSS_BROWSER_EVIDENCE_DIR}/matrix.json` as const;

export const CROSS_BROWSER_MATRIX_MD =
  `${CROSS_BROWSER_EVIDENCE_DIR}/MATRIX.md` as const;

export const CROSS_BROWSER_PLAYWRIGHT_RESULT_JSON =
  `${CROSS_BROWSER_EVIDENCE_DIR}/playwright-results.json` as const;

export type CrossBrowserCellResult = "PASS" | "FAIL" | "SKIP" | "UNVERIFIED";

export type CrossBrowserEvidenceSnapshot = {
  version: typeof CROSS_BROWSER_CERTIFICATION_VERSION;
  origin: typeof CROSS_BROWSER_CERT_ORIGIN;
  generatedAt?: string;
  overall: "PASS" | "FAIL" | "UNVERIFIED";
  targets: Array<{
    id: CrossBrowserTargetId;
    label: string;
    playwrightProject: string;
    executionMode: CrossBrowserExecutionMode;
    result: CrossBrowserCellResult;
    pages: Array<{
      id: CrossBrowserPageId;
      label: string;
      result: CrossBrowserCellResult;
      defects: string[];
    }>;
    defects: string[];
    limitations: readonly string[];
  }>;
  defects: string[];
  fixes: string[];
  remainingLimitations: string[];
};

export function getCrossBrowserTarget(id: CrossBrowserTargetId): CrossBrowserTarget {
  const target = CROSS_BROWSER_TARGETS.find((entry) => entry.id === id);
  if (!target) {
    throw new Error(`Unknown cross-browser target: ${id}`);
  }
  return target;
}

export function getCrossBrowserPlaywrightProjectNames(): readonly string[] {
  return CROSS_BROWSER_TARGETS.map((t) => t.playwrightProject);
}

export function emptyCrossBrowserEvidence(): CrossBrowserEvidenceSnapshot {
  return {
    version: CROSS_BROWSER_CERTIFICATION_VERSION,
    origin: CROSS_BROWSER_CERT_ORIGIN,
    overall: "UNVERIFIED",
    targets: CROSS_BROWSER_TARGETS.map((target) => ({
      id: target.id,
      label: target.label,
      playwrightProject: target.playwrightProject,
      executionMode: target.executionMode,
      result: "UNVERIFIED",
      pages: CROSS_BROWSER_PAGES.map((page) => ({
        id: page.id,
        label: page.label,
        result: "UNVERIFIED",
        defects: [],
      })),
      defects: ["Runtime evidence missing — Cross Browser Certification has not been executed."],
      limitations: target.limitations,
    })),
    defects: [
      "Cross Browser Certification Engine v1.0 has no runtime evidence yet.",
      "Do not claim PASS until every supported browser × device × page cell is verified.",
    ],
    fixes: [],
    remainingLimitations: collectStaticLimitations(),
  };
}

export function collectStaticLimitations(): string[] {
  const unique = new Set<string>();
  for (const target of CROSS_BROWSER_TARGETS) {
    for (const line of target.limitations) unique.add(line);
  }
  unique.add(
    "Physical Owner phone / tablet approval uses https://www.rovexo.co.uk (Owner Preview Policy v3.0) — separate from this localhost engine.",
  );
  unique.add(
    "Real Samsung Internet binary and real Chrome iOS WKWebView are not available as Playwright browsers on Linux CI.",
  );
  return [...unique];
}

export function readCrossBrowserEvidence(
  cwd: string = process.cwd(),
): CrossBrowserEvidenceSnapshot | null {
  const path = join(cwd, CROSS_BROWSER_MATRIX_JSON);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CrossBrowserEvidenceSnapshot;
  } catch {
    return null;
  }
}

export type CrossBrowserCertificationVerdict = {
  pass: boolean;
  overall: CrossBrowserEvidenceSnapshot["overall"];
  reason: string;
  evidence: CrossBrowserEvidenceSnapshot;
  mandatoryBeforePreviewRelease: true;
};

/**
 * Fail-closed gate: Preview Release is forbidden until overall === PASS
 * with every target verified (no UNVERIFIED / FAIL cells).
 */
export function evaluateCrossBrowserCertification(
  evidence: CrossBrowserEvidenceSnapshot | null = readCrossBrowserEvidence(),
): CrossBrowserCertificationVerdict {
  const snapshot = evidence ?? emptyCrossBrowserEvidence();
  const unverified = snapshot.targets.filter((t) => t.result === "UNVERIFIED");
  const failed = snapshot.targets.filter((t) => t.result === "FAIL");
  const skippedOnly = snapshot.targets.every(
    (t) => t.result === "SKIP" || t.result === "PASS",
  );

  if (!evidence) {
    return {
      pass: false,
      overall: "UNVERIFIED",
      reason:
        "NO RUNTIME EVIDENCE — run npm run test:e2e:cross-browser before Preview Release.",
      evidence: snapshot,
      mandatoryBeforePreviewRelease: true,
    };
  }

  if (failed.length > 0) {
    return {
      pass: false,
      overall: "FAIL",
      reason: `FAIL — ${failed.length} browser/device target(s) failed Cross Browser Certification.`,
      evidence: snapshot,
      mandatoryBeforePreviewRelease: true,
    };
  }

  if (unverified.length > 0) {
    return {
      pass: false,
      overall: "UNVERIFIED",
      reason: `UNVERIFIED — ${unverified.length} target(s) missing evidence.`,
      evidence: snapshot,
      mandatoryBeforePreviewRelease: true,
    };
  }

  if (snapshot.overall !== "PASS") {
    return {
      pass: false,
      overall: snapshot.overall,
      reason: `Overall status is ${snapshot.overall} — Preview Release blocked.`,
      evidence: snapshot,
      mandatoryBeforePreviewRelease: true,
    };
  }

  if (skippedOnly && snapshot.targets.some((t) => t.result === "SKIP")) {
    return {
      pass: false,
      overall: "FAIL",
      reason:
        "One or more targets were SKIPPED (browser not installed). Install Playwright browsers and re-run. SKIP ≠ PASS.",
      evidence: snapshot,
      mandatoryBeforePreviewRelease: true,
    };
  }

  return {
    pass: true,
    overall: "PASS",
    reason: "All Cross Browser Certification targets PASS with runtime evidence.",
    evidence: snapshot,
    mandatoryBeforePreviewRelease: true,
  };
}

export function assertCrossBrowserCertificationOrBlock(
  evidence: CrossBrowserEvidenceSnapshot | null = readCrossBrowserEvidence(),
): CrossBrowserCertificationVerdict {
  const verdict = evaluateCrossBrowserCertification(evidence);
  if (!verdict.pass) {
    throw new Error(
      `[${CROSS_BROWSER_CERTIFICATION_ID}] ${verdict.reason} Preview Release FORBIDDEN.`,
    );
  }
  return verdict;
}

export function renderCrossBrowserMatrixMarkdown(
  evidence: CrossBrowserEvidenceSnapshot,
): string {
  const lines: string[] = [
    `# ROVEXO Cross Browser Certification Matrix ${CROSS_BROWSER_CERTIFICATION_VERSION}`,
    "",
    `**Overall:** ${evidence.overall}`,
    `**Origin:** ${evidence.origin}`,
    `**Generated:** ${evidence.generatedAt ?? "(not set)"}`,
    `**Status:** ${CROSS_BROWSER_CERTIFICATION_STATUS}`,
    "",
    "## Browser × Device",
    "",
    "| Target | Browser | Device | Mode | Result | Defects |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const target of evidence.targets) {
    const defects = target.defects.length ? target.defects.join("; ") : "—";
    lines.push(
      `| ${target.label} | ${target.playwrightProject} | ${target.id} | ${target.executionMode} | **${target.result}** | ${defects} |`,
    );
  }

  lines.push("", "## Pages (per target)", "");
  for (const target of evidence.targets) {
    lines.push(`### ${target.label} — ${target.result}`, "");
    lines.push("| Page | Result | Defects |", "| --- | --- | --- |");
    for (const page of target.pages) {
      lines.push(
        `| ${page.label} | ${page.result} | ${page.defects.length ? page.defects.join("; ") : "—"} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Defects", "");
  if (evidence.defects.length === 0) lines.push("- (none)");
  else for (const d of evidence.defects) lines.push(`- ${d}`);

  lines.push("", "## Fixes applied", "");
  if (evidence.fixes.length === 0) lines.push("- (none recorded this run)");
  else for (const f of evidence.fixes) lines.push(`- ${f}`);

  lines.push("", "## Remaining limitations", "");
  for (const lim of evidence.remainingLimitations) lines.push(`- ${lim}`);

  lines.push(
    "",
    "## Gate",
    "",
    "Cross Browser Certification is **mandatory before Preview Release**.",
    "Do **not** claim PASS until every supported browser has been verified.",
    "NO commit · NO push · NO deploy from this report alone.",
    "",
  );

  return lines.join("\n");
}

export const CROSS_BROWSER_CERTIFICATION_CONTRACT = {
  id: CROSS_BROWSER_CERTIFICATION_ID,
  version: CROSS_BROWSER_CERTIFICATION_VERSION,
  status: CROSS_BROWSER_CERTIFICATION_STATUS,
  origin: CROSS_BROWSER_CERT_ORIGIN,
  padContract: CROSS_BROWSER_PAD_CONTRACT,
  targets: CROSS_BROWSER_TARGETS,
  pages: CROSS_BROWSER_PAGES,
  verifyAxes: CROSS_BROWSER_VERIFY_AXES,
  matrixCellCount: CROSS_BROWSER_MATRIX_CELL_COUNT,
  evidenceDir: CROSS_BROWSER_EVIDENCE_DIR,
  mandatoryBeforePreviewRelease: true as const,
  forbiddenClaimsWithoutEvidence: [
    "PASS",
    "identical across browsers",
    "Preview Release ready",
    "Production ready",
  ] as const,
} as const;
