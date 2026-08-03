/**
 * Playwright project for Realtime Engine Certification v1.0.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "@playwright/test";

const REALTIME_SPEC = /realtime-certification\.spec\.ts/;

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

export function buildRealtimeCertificationProjects() {
  if (!isChromiumInstalled()) return [];
  return [
    {
      name: "realtime-chromium",
      testMatch: REALTIME_SPEC,
      use: { ...devices["Desktop Chrome"] },
    },
  ];
}
