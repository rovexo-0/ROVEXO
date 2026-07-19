#!/usr/bin/env node
/**
 * Run Playwright with Vercel-safe Chromium env (LD_LIBRARY_PATH + executablePath).
 * Absolute Final: fail closed when Supabase E2E secrets are missing/redacted.
 */
import { spawnSync } from "node:child_process";
import {
  preparePlaywrightChromium,
  readVercelChromiumConfig,
} from "./install-playwright-chromium.mjs";

const ensure = spawnSync("node", ["scripts/ensure-e2e-env.mjs"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
if ((ensure.status ?? 1) !== 0) {
  process.exit(ensure.status ?? 1);
}

const prepared = await preparePlaywrightChromium();
const marker = readVercelChromiumConfig();

const env = {
  ...process.env,
  ...prepared,
};

if (marker?.executablePath) {
  env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = marker.executablePath;
  env.LD_LIBRARY_PATH = marker.ldLibraryPath;
  if (!env.AWS_LAMBDA_JS_RUNTIME) {
    env.AWS_LAMBDA_JS_RUNTIME = "nodejs22.x";
  }
}

const args = process.argv.slice(2);
const result = spawnSync("npx", ["playwright", "test", ...args], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
