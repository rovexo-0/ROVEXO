#!/usr/bin/env node
/**
 * Install / prepare Chromium for Playwright certification.
 *
 * Local: Playwright Chromium (+ optional system deps).
 * Vercel: @sparticuz/chromium — Vercel Amazon Linux lacks libnspr4.so for
 * Playwright's Ubuntu fallback browser, which breaks E2E at launch.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PLAYWRIGHT_VERCEL_CHROMIUM_MARKER = path.join(
  process.cwd(),
  ".playwright-vercel-chromium.json",
);

const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

export function readVercelChromiumConfig() {
  if (!fs.existsSync(PLAYWRIGHT_VERCEL_CHROMIUM_MARKER)) return null;
  try {
    return JSON.parse(fs.readFileSync(PLAYWRIGHT_VERCEL_CHROMIUM_MARKER, "utf8"));
  } catch {
    return null;
  }
}

async function prepareVercelChromium() {
  if (!process.env.AWS_LAMBDA_JS_RUNTIME) {
    process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs22.x";
  }

  const chromium = (await import("@sparticuz/chromium")).default;
  if (typeof chromium.setGraphicsMode === "function") {
    chromium.setGraphicsMode(false);
  }

  const executablePath = await chromium.executablePath();
  const libDir = path.dirname(executablePath);
  const ldLibraryPath = [libDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");

  const payload = {
    executablePath,
    ldLibraryPath,
    args: Array.isArray(chromium.args) ? chromium.args : [],
  };
  fs.writeFileSync(
    PLAYWRIGHT_VERCEL_CHROMIUM_MARKER,
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );

  console.log(`[playwright] Vercel Chromium ready: ${executablePath}`);
  return {
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: executablePath,
    LD_LIBRARY_PATH: ldLibraryPath,
    AWS_LAMBDA_JS_RUNTIME: process.env.AWS_LAMBDA_JS_RUNTIME,
  };
}

export async function preparePlaywrightChromium() {
  if (onVercel) {
    return prepareVercelChromium();
  }

  if (fs.existsSync(PLAYWRIGHT_VERCEL_CHROMIUM_MARKER)) {
    fs.unlinkSync(PLAYWRIGHT_VERCEL_CHROMIUM_MARKER);
  }

  console.log("[playwright] Installing Chromium browser binary…");
  if (!run("npx", ["playwright", "install", "chromium"])) {
    throw new Error("playwright install chromium failed");
  }

  // Best-effort local deps; do not fail closed for interactive local machines.
  if (process.platform === "linux" && (process.env.CI || !process.stdin.isTTY)) {
    run("npx", ["playwright", "install-deps", "chromium"]);
  }

  console.log("[playwright] Chromium install complete.");
  return {};
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  await preparePlaywrightChromium();
}
