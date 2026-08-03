/**
 * Playwright projects for ROVEXO Cross Browser Certification Engine v1.0.
 * Each project runs ONLY e2e/cross-browser-certification.spec.ts.
 * Keep project names in sync with lib/cross-browser/cross-browser-certification-engine-v1.ts
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, devices, firefox, webkit } from "@playwright/test";

const XCB_SPEC = /cross-browser-certification\.spec\.ts/;

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
    // WebKit on Linux/WSL often cannot launch without host libs (libxslt, libwoff2, …).
    // Require an explicit successful launch probe marker unless FORCE is set.
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

/**
 * Probe WebKit launch once and cache result for project generation + runner.
 */
export async function probeWebkitLaunchable() {
  const marker = path.join(process.cwd(), ".playwright-webkit-launchable");
  try {
    const browser = await webkit.launch({ headless: true });
    await browser.close();
    fs.writeFileSync(marker, `${JSON.stringify({ ok: true, at: new Date().toISOString() })}\n`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fs.writeFileSync(
      marker,
      `${JSON.stringify({ ok: false, at: new Date().toISOString(), message })}\n`,
    );
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

/**
 * Prefer native Edge channel when explicitly requested; otherwise Chromium + Desktop Edge profile.
 * Linux CI rarely has msedge — forcing the channel would skip Edge entirely.
 */
function edgeUse() {
  const base = { ...resolveDevice("Desktop Edge") };
  if (process.env.PLAYWRIGHT_EDGE_CHANNEL === "1") {
    return { ...base, channel: "msedge" };
  }
  return base;
}

/**
 * Build Cross Browser Certification projects for every installed engine.
 * Missing engines produce no project — the runner marks those targets SKIP/FAIL closed.
 */
export function buildCrossBrowserCertificationProjects() {
  const projects = [];

  if (isBrowserInstalled(chromium)) {
    projects.push(
      {
        name: "xcb-chrome-desktop",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("Desktop Chrome") },
      },
      {
        name: "xcb-edge-desktop",
        testMatch: XCB_SPEC,
        use: edgeUse(),
      },
      {
        name: "xcb-chrome-ios-iphone-15",
        testMatch: XCB_SPEC,
        use: {
          ...resolveDevice("iPhone 15"),
          // iPhone descriptors default to webkit — force Chromium for CriOS emulation.
          defaultBrowserType: "chromium",
          browserName: "chromium",
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
        },
      },
      {
        name: "xcb-chrome-ios-iphone-latest",
        testMatch: XCB_SPEC,
        use: {
          ...resolveDevice("iPhone 17 Pro Max"),
          defaultBrowserType: "chromium",
          browserName: "chromium",
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
        },
      },
      {
        name: "xcb-chrome-android-pixel",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("Pixel 7") },
      },
      {
        name: "xcb-chrome-android-samsung",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("Galaxy S24") },
      },
      {
        name: "xcb-chrome-android-fold",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("Galaxy Z Fold 7") },
      },
      {
        name: "xcb-samsung-internet-galaxy",
        testMatch: XCB_SPEC,
        use: {
          ...resolveDevice("Galaxy S24"),
          userAgent:
            "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/122.0.0.0 Mobile Safari/537.36",
        },
      },
      {
        name: "xcb-android-tablet-chrome",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("Galaxy Tab S9") },
      },
    );
  }

  if (isBrowserInstalled(firefox)) {
    projects.push({
      name: "xcb-firefox-desktop",
      testMatch: XCB_SPEC,
      use: { ...resolveDevice("Desktop Firefox") },
    });
  }

  if (isBrowserInstalled(webkit)) {
    projects.push(
      {
        name: "xcb-safari-desktop",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("Desktop Safari") },
      },
      {
        name: "xcb-safari-ios-iphone-se",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("iPhone SE") },
      },
      {
        name: "xcb-safari-ios-iphone-13",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("iPhone 13") },
      },
      {
        name: "xcb-safari-ios-iphone-15",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("iPhone 15") },
      },
      {
        name: "xcb-safari-ios-iphone-15-pro-max",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("iPhone 15 Pro Max") },
      },
      {
        name: "xcb-safari-ios-iphone-latest",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("iPhone 17 Pro Max") },
      },
      {
        name: "xcb-ipad-safari",
        testMatch: XCB_SPEC,
        use: { ...resolveDevice("iPad Pro 11") },
      },
    );
  }

  return projects;
}

export function listInstalledCrossBrowserEngines() {
  return {
    chromium: isBrowserInstalled(chromium),
    firefox: isBrowserInstalled(firefox),
    webkit: isBrowserInstalled(webkit),
  };
}
