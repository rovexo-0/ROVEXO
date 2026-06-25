import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadDotEnvFiles, resolvePackageManager } from "./playwright-env.mjs";

/**
 * Returns true when a production Next.js build exists.
 */
export function hasProductionBuild(cwd = process.cwd()) {
  return fs.existsSync(path.join(cwd, ".next", "BUILD_ID"));
}

/**
 * Run `next build` with the same env Playwright uses for the web server.
 */
export function runProductionBuild(env = process.env) {
  const pm = resolvePackageManager();
  execSync(`${pm} run build`, {
    stdio: "inherit",
    env: { ...process.env, ...env, NODE_ENV: "production" },
    cwd: process.cwd(),
    shell: true,
  });
}

/**
 * Ensure `.next/BUILD_ID` exists before `next start` is launched.
 */
export function ensureProductionBuild(webServerEnv) {
  loadDotEnvFiles();
  if (hasProductionBuild()) {
    return;
  }
  console.log("[playwright] No production build found — running next build…");
  runProductionBuild(webServerEnv);
}

/**
 * Build the web-server shell command for Playwright.
 * Production mode (`next start`) is the default — stable on Windows and matches CI.
 * Set PLAYWRIGHT_DEV_SERVER=1 to use `next dev` for faster local iteration.
 */
export function buildWebServerCommand(port) {
  const pm = resolvePackageManager();
  const portFlag = `-p ${port}`;
  const useDevServer = process.env.PLAYWRIGHT_DEV_SERVER === "1";

  if (useDevServer) {
    return `${pm} run dev -- ${portFlag}`;
  }

  // Pre-build script runs before start when BUILD_ID is missing.
  return `node scripts/playwright-prestart.mjs ${port}`;
}
