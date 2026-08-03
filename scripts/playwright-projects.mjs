import fs from "node:fs";
import path from "node:path";
import { chromium, devices, firefox, webkit } from "@playwright/test";
import { buildCrossBrowserCertificationProjects } from "./playwright-cross-browser-projects.mjs";
import { buildMobileDeviceCertificationProjects } from "./playwright-mobile-device-projects.mjs";
import { buildAccessibilityCertificationProjects } from "./playwright-accessibility-projects.mjs";
import { buildRealtimeCertificationProjects } from "./playwright-realtime-projects.mjs";

const IGNORE_CERT_SPECS =
  /sell-android\.spec\.ts|cross-browser-certification\.spec\.ts|mobile-device-certification\.spec\.ts|accessibility-certification\.spec\.ts|realtime-certification\.spec\.ts|account-android\.spec\.ts/;

function hasVercelChromiumOverride() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return true;
  return fs.existsSync(path.join(process.cwd(), ".playwright-vercel-chromium.json"));
}

/**
 * Returns true when Playwright can locate a browser executable on disk.
 */
function isBrowserInstalled(browserType) {
  if (browserType === chromium && hasVercelChromiumOverride()) {
    return true;
  }
  try {
    const executablePath = browserType.executablePath();
    return typeof executablePath === "string" && fs.existsSync(executablePath);
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
    testIgnore: IGNORE_CERT_SPECS,
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
        testIgnore: IGNORE_CERT_SPECS,
        use: { ...devices["Desktop Edge"] },
      },
      {
        name: "iphone-safari",
        testIgnore: IGNORE_CERT_SPECS,
        use: { ...devices["iPhone 14"] },
      },
      {
        name: "iphone-chrome",
        testIgnore: IGNORE_CERT_SPECS,
        use: {
          ...devices["iPhone 14"],
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
        },
      },
      {
        name: "chrome-android",
        testMatch:
          /mobile-scroll-standard\.spec\.ts|responsive\.spec\.ts|welcome-v2\.spec\.ts/,
        use: { ...devices["Pixel 7"] },
      },
      {
        name: "samsung-internet",
        testIgnore: IGNORE_CERT_SPECS,
        use: {
          ...devices["Galaxy S9+"],
          userAgent:
            "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.5790.166 Mobile Safari/537.36",
        },
      },
      {
        name: "tablet-ipad-portrait",
        testIgnore: IGNORE_CERT_SPECS,
        use: { ...devices["iPad Pro 11"] },
      },
      {
        name: "tablet-ipad-landscape",
        testIgnore: IGNORE_CERT_SPECS,
        use: {
          ...devices["iPad Pro 11 landscape"],
        },
      },
      {
        name: "desktop-wide",
        testIgnore: IGNORE_CERT_SPECS,
        use: {
          viewport: { width: 1440, height: 900 },
          userAgent: devices["Desktop Chrome"].userAgent,
        },
      },
    );
  }

  return [
    ...desktop,
    ...mobileAndTablet,
    buildAndroidSellProject(),
    ...buildCrossBrowserCertificationProjects(),
    ...buildMobileDeviceCertificationProjects(),
    ...buildAccessibilityCertificationProjects(),
    ...buildRealtimeCertificationProjects(),
  ];
}
