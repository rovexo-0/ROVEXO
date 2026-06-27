import { devices } from "@playwright/test";
import { chromium, firefox, webkit } from "playwright";

/**
 * Returns true when Playwright can locate a browser executable on disk.
 */
function isBrowserInstalled(browserType) {
  try {
    browserType.executablePath();
    return true;
  } catch {
    return false;
  }
}

const DESKTOP_BROWSERS = [
  {
    name: "chromium",
    browserType: chromium,
    device: devices["Desktop Chrome"],
  },
  {
    name: "firefox",
    browserType: firefox,
    device: devices["Desktop Firefox"],
  },
  {
    name: "webkit",
    browserType: webkit,
    device: devices["Desktop Safari"],
  },
];

/**
 * Build Playwright projects for every installed desktop browser.
 * Chromium is always included (throws a clear error if missing).
 */
export function buildDesktopProjects() {
  const installed = DESKTOP_BROWSERS.filter(({ browserType }) => isBrowserInstalled(browserType));

  if (!installed.some((entry) => entry.name === "chromium")) {
    throw new Error(
      [
        "Playwright Chromium is not installed.",
        "Run: npx playwright install chromium",
        "Or:  pnpm exec playwright install chromium",
      ].join("\n"),
    );
  }

  if (installed.length === 0) {
    throw new Error("No Playwright browsers are installed. Run: npx playwright install");
  }

  return installed.map(({ name, device }) => ({
    name,
    testIgnore: /sell-android\.spec\.ts/,
    use: { ...device },
  }));
}

/**
 * Screenshot suite runs on Chromium only to avoid duplicate captures across browsers.
 */
export function buildScreenshotProject() {
  if (!isBrowserInstalled(chromium)) return null;

  return {
    name: "chromium-screenshots",
    testMatch: /(screenshots|owner-review-gallery|owner-review-screenshots|owner-final-visual-review|homepage-premium-polish-review|owner-review-phase1|owner-review-homepage-final|owner-review-brand)\.spec\.ts/,
    use: { ...devices["Desktop Chrome"] },
  };
}

/**
 * Android Chromium project for the sell flow E2E (camera capture + mobile viewport).
 */
export function buildAndroidSellProject() {
  if (!isBrowserInstalled(chromium)) {
    throw new Error(
      "Playwright Chromium is required for the Android sell E2E test. Run: npx playwright install chromium",
    );
  }

  return {
    name: "android-chromium",
    testMatch: /sell-android\.spec\.ts/,
    use: {
      ...devices["Pixel 7"],
    },
  };
}

/**
 * All projects: installed desktop browsers + dedicated Android sell project.
 */
export function buildAllProjects() {
  const screenshotProject = buildScreenshotProject();
  const desktop = buildDesktopProjects().map((project) => ({
    ...project,
    testIgnore: [/sell-android\.spec\.ts/, /screenshots\.spec\.ts/, /owner-review-screenshots\.spec\.ts/, /owner-final-visual-review\.spec\.ts/, /owner-review-gallery\.spec\.ts/],
  }));

  return screenshotProject
    ? [...desktop, screenshotProject, buildAndroidSellProject()]
    : [...desktop, buildAndroidSellProject()];
}
