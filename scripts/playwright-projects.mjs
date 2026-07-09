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
    testMatch: /sell-android\.spec\.ts|account-android\.spec\.ts/,
    use: {
      ...devices["Pixel 7"],
    },
  };
}

/**
 * All projects: installed desktop browsers + mobile/tablet certification matrix.
 */
export function buildAllProjects() {
  const desktop = buildDesktopProjects();

  const mobileAndTablet = [];

  if (isBrowserInstalled(chromium)) {
    mobileAndTablet.push(
      {
        name: "edge-chromium",
        testIgnore: /sell-android\.spec\.ts/,
        use: { ...devices["Desktop Edge"] },
      },
      {
        name: "iphone-safari",
        testIgnore: /sell-android\.spec\.ts/,
        use: { ...devices["iPhone 14"] },
      },
      {
        name: "iphone-chrome",
        testIgnore: /sell-android\.spec\.ts/,
        use: {
          ...devices["iPhone 14"],
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
        },
      },
      {
        name: "chrome-android",
        testMatch: /mobile-scroll-standard\.spec\.ts/,
        use: { ...devices["Pixel 7"] },
      },
      {
        name: "samsung-internet",
        testIgnore: /sell-android\.spec\.ts/,
        use: {
          ...devices["Galaxy S9+"],
          userAgent:
            "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.5790.166 Mobile Safari/537.36",
        },
      },
      {
        name: "tablet-ipad-portrait",
        testIgnore: /sell-android\.spec\.ts/,
        use: { ...devices["iPad Pro 11"] },
      },
      {
        name: "tablet-ipad-landscape",
        testIgnore: /sell-android\.spec\.ts/,
        use: {
          ...devices["iPad Pro 11 landscape"],
        },
      },
      {
        name: "desktop-wide",
        testIgnore: /sell-android\.spec\.ts/,
        use: {
          viewport: { width: 1440, height: 900 },
          userAgent: devices["Desktop Chrome"].userAgent,
        },
      },
    );
  }

  return [...desktop, ...mobileAndTablet, buildAndroidSellProject()];
}
