/**
 * Playwright project for Accessibility Certification Engine v1.0.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "@playwright/test";

const A11Y_SPEC = /accessibility-certification\.spec\.ts/;

function hasVercelChromiumOverride() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return true;
  return fs.existsSync(path.join(process.cwd(), ".playwright-vercel-chromium.json"));
}

function isChromiumInstalled() {
  if (hasVercelChromiumOverride()) return true;
  try {
    const executablePath = chromium.executablePath();
    return typeof executablePath === "string" && fs.existsSync(executablePath);
  } catch {
    return false;
  }
}

export function buildAccessibilityCertificationProjects() {
  if (!isChromiumInstalled()) return [];
  return [
    {
      name: "a11y-chromium-iphone",
      testMatch: A11Y_SPEC,
      use: { ...devices["iPhone 15"] },
    },
  ];
}
