import { defineConfig } from "@playwright/test";
import { buildAllProjects } from "./scripts/playwright-projects.mjs";
import { loadDotEnvFiles } from "./scripts/playwright-env.mjs";

// Load local secrets (Supabase, Stripe, etc.) for the dev server and integration tests.
loadDotEnvFiles();

// Fixed managed port — do not inherit PLAYWRIGHT_PORT from the shell or .env.local.
const managedE2EPort = "13025";
const port =
  process.env.PLAYWRIGHT_ALLOW_REMOTE === "1"
    ? (process.env.PLAYWRIGHT_PORT ?? managedE2EPort)
    : managedE2EPort;
// Always target the managed local E2E server (ignore PLAYWRIGHT_BASE_URL / SKIP from .env.local).
const localBaseURL = `http://127.0.0.1:${port}`;
const baseURL = localBaseURL;
// Always use the managed local E2E server unless explicitly skipped (ignore shell PLAYWRIGHT_ALLOW_REMOTE).
const useManagedWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1";
const isCI = Boolean(process.env.CI);

const webServerEnvObj: Record<string, string> = {
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-RNEMD5BT0S",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "placeholder",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "placeholder",
  // Always align app URL with the Playwright-managed server port (do not inherit .env.local).
  NEXT_PUBLIC_APP_URL: localBaseURL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_placeholder",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_placeholder",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "ROVEXO <support@rovexo.co.uk>",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "https://placeholder.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "placeholder",
  CRON_SECRET: process.env.CRON_SECRET ?? "placeholder",
  SENDCLOUD_PUBLIC_KEY: process.env.SENDCLOUD_PUBLIC_KEY ?? "sendcloud_public_test_placeholder",
  SENDCLOUD_SECRET_KEY: process.env.SENDCLOUD_SECRET_KEY ?? "sendcloud_secret_test_placeholder",
  ROVEXO_LAUNCH_PRIVATE_MODE: "1",
  ROVEXO_VIRTUAL_PAYMENTS: "1",
  ROVEXO_VIRTUAL_WALLET: "1",
  SENDCLOUD_SANDBOX: "1",
  PLAYWRIGHT_E2E: "1",
  ROVEXO_HOMEPAGE_DEMO: "1",
  NODE_ENV: process.env.PLAYWRIGHT_DEV_SERVER === "1" ? "development" : "production",
};

function webServerCommand() {
  if (process.env.PLAYWRIGHT_DEV_SERVER === "1") {
    return `npx next dev -p ${port}`;
  }
  return `node scripts/playwright-prestart.mjs ${port}`;
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./scripts/playwright-global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Serial workers on CI; limit parallel desktop browsers locally on Windows to reduce flakiness.
  workers: isCI ? 1 : process.platform === "win32" ? 2 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL,
    // Prevent stale navigate HTML from public/sw.js during layout E2E.
    serviceWorkers: "block",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  projects: buildAllProjects(),
  webServer: useManagedWebServer
    ? {
        command: webServerCommand(),
        url: `${baseURL}/api/health/live`,
        // Never attach to a stale dev server on another port (e.g. 3020 from .env.local).
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: webServerEnvObj,
      }
    : undefined,
});
