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

function buildContainsMessagesV1(cwd = process.cwd()) {
  const manifestPath = path.join(cwd, ".next", "server", "app", "messages", "page_client-reference-manifest.js");
  if (!fs.existsSync(manifestPath)) return false;
  return fs.readFileSync(manifestPath, "utf8").includes("MessagesInboxV1");
}

function removeProductionBuild(cwd = process.cwd()) {
  const nextDir = path.join(cwd, ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
}

/**
 * Ensure `.next/BUILD_ID` exists before `next start` is launched.
 * Rebuilds when canonical UI sources are newer than the last build, or when the
 * existing build still serves the pre-v1 messages route.
 */
export function ensureProductionBuild(webServerEnv) {
  loadDotEnvFiles();
  const staleSources = [
    "features/account-center/components/AccountCenterHome.tsx",
    "styles/rovexo/account-hub-v1.css",
    "styles/rovexo/account-module-v1.css",
    "app/account/page.tsx",
    "features/account-module/components/ProfileViewV1.tsx",
    "features/account-module/components/SellerListingsV1.tsx",
    "features/account-module/components/OrdersV1.tsx",
    "features/account-module/components/SavedItemsV1.tsx",
    "features/account-module/components/SettingsV1.tsx",
    "features/messages/components/MessagesInboxV1.tsx",
    "features/messages/components/ChatPage.tsx",
    "styles/rovexo/messages-v1.css",
    "app/messages/page.tsx",
    "features/notifications/components/NotificationsInboxV1.tsx",
    "styles/rovexo/notifications-v1.css",
    "app/notifications/page.tsx",
  ];
  const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
  const buildMtime = fs.existsSync(buildIdPath) ? fs.statSync(buildIdPath).mtimeMs : 0;
  const sourceIsNewer = staleSources.some((rel) => {
    const abs = path.join(process.cwd(), rel);
    return fs.existsSync(abs) && fs.statSync(abs).mtimeMs > buildMtime;
  });
  const messagesRoute = path.join(process.cwd(), "app", "messages", "page.tsx");
  const messagesRouteUsesV1 =
    fs.existsSync(messagesRoute) && fs.readFileSync(messagesRoute, "utf8").includes("MessagesInboxV1");
  const buildIsStaleForMessages = messagesRouteUsesV1 && hasProductionBuild() && !buildContainsMessagesV1();

  if (!hasProductionBuild() || sourceIsNewer || buildIsStaleForMessages) {
    if (buildIsStaleForMessages) {
      console.log("[playwright] Stale messages build detected — clearing .next and rebuilding…");
      removeProductionBuild();
    } else {
      console.log("[playwright] Running next build…");
    }
    runProductionBuild(webServerEnv);
  }
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
