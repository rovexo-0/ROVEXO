/**
 * Playwright projects for ROVEXO Mobile Device Certification Engine v1.0.
 * All project names are `mdc-*` (do not collide with Cross Browser `xcb-*`).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, devices, firefox, webkit } from "@playwright/test";

const MDC_SPEC = /mobile-device-certification\.spec\.ts/;

function hasVercelChromiumOverride() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return true;
  return fs.existsSync(path.join(process.cwd(), ".playwright-vercel-chromium.json"));
}

function isBrowserInstalled(browserType) {
  if (browserType === chromium && hasVercelChromiumOverride()) {
    return true;
  }
  try {
    const executablePath = browserType.executablePath();
    if (typeof executablePath !== "string" || !fs.existsSync(executablePath)) {
      return false;
    }
    if (browserType === webkit && process.env.PLAYWRIGHT_FORCE_WEBKIT !== "1") {
      const marker = path.join(process.cwd(), ".playwright-webkit-launchable");
      if (!fs.existsSync(marker)) return false;
      try {
        return JSON.parse(fs.readFileSync(marker, "utf8")).ok === true;
      } catch {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function resolveDevice(name) {
  const device = devices[name];
  if (!device) {
    throw new Error(`Playwright device descriptor missing: ${name}`);
  }
  return device;
}

const CHROME_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1";

const SAMSUNG_INTERNET_UA =
  "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/122.0.0.0 Mobile Safari/537.36";

export function buildMobileDeviceCertificationProjects() {
  const projects = [];

  if (isBrowserInstalled(chromium)) {
    projects.push(
      {
        name: "mdc-chrome-ios-iphone-15",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone 15"), userAgent: CHROME_IOS_UA },
      },
      {
        name: "mdc-chrome-ios-iphone-latest",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone 17 Pro Max"), userAgent: CHROME_IOS_UA },
      },
      {
        name: "mdc-chrome-android-pixel",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("Pixel 7") },
      },
      {
        name: "mdc-chrome-android-samsung",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("Galaxy S24") },
      },
      {
        name: "mdc-chrome-android-fold",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("Galaxy Z Fold 7") },
      },
      {
        name: "mdc-samsung-internet-galaxy",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("Galaxy S24"), userAgent: SAMSUNG_INTERNET_UA },
      },
      {
        name: "mdc-android-tablet-chrome",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("Galaxy Tab S9") },
      },
    );
  }

  if (isBrowserInstalled(webkit)) {
    projects.push(
      {
        name: "mdc-safari-ios-iphone-se",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone SE") },
      },
      {
        name: "mdc-safari-ios-iphone-13",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone 13") },
      },
      {
        name: "mdc-safari-ios-iphone-15",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone 15") },
      },
      {
        name: "mdc-safari-ios-iphone-15-pro",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone 15 Pro") },
      },
      {
        name: "mdc-safari-ios-iphone-15-pro-max",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone 15 Pro Max") },
      },
      {
        name: "mdc-safari-ios-iphone-latest",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPhone 17 Pro Max") },
      },
      {
        name: "mdc-ipad-safari",
        testMatch: MDC_SPEC,
        use: { ...resolveDevice("iPad Pro 11") },
      },
    );
  }

  void firefox;
  return projects;
}

export function listInstalledMobileDeviceEngines() {
  return {
    chromium: isBrowserInstalled(chromium),
    webkit: isBrowserInstalled(webkit),
  };
}
