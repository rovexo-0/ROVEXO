import { defineConfig } from "@playwright/test";
import { buildAllProjects } from "./scripts/playwright-projects.mjs";
import { loadDotEnvFiles } from "./scripts/playwright-env.mjs";

// Load local secrets (Supabase, Stripe, etc.) for the dev server and integration tests.
loadDotEnvFiles();

const port = process.env.PLAYWRIGHT_PORT ?? "3010";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
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
  NEXT_PUBLIC_APP_URL: baseURL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_placeholder",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_placeholder",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "ROVEXO <support@rovexo.co.uk>",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "https://placeholder.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "placeholder",
  CRON_SECRET: process.env.CRON_SECRET ?? "placeholder",
  PLAYWRIGHT_E2E: "1",
  NODE_ENV: process.env.PLAYWRIGHT_DEV_SERVER === "1" ? "development" : "production",
};

function webServerCommand() {
  if (process.env.PLAYWRIGHT_DEV_SERVER === "1") {
    return `npx next dev -p ${port}`;
  }
  return `npx next start -p ${port}`;
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
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: webServerCommand(),
        url: `${baseURL}/api/health/live`,
        // Only reuse an existing server when explicitly opted in (avoids stale/broken dev servers).
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
        timeout: 300_000,
        env: webServerEnvObj,
      },
});
