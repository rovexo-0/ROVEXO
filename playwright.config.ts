import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3010";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

const webServerEnv =
  "NEXT_PUBLIC_GA_MEASUREMENT_ID=G-RNEMD5BT0S " +
  "NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co " +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder " +
  "SUPABASE_SERVICE_ROLE_KEY=placeholder " +
  `NEXT_PUBLIC_APP_URL=${baseURL} ` +
  "STRIPE_SECRET_KEY=sk_test_placeholder " +
  "STRIPE_WEBHOOK_SECRET=whsec_placeholder " +
  "RESEND_API_KEY=re_placeholder " +
  "EMAIL_FROM='ROVEXO <noreply@rovexo.com>' " +
  "UPSTASH_REDIS_REST_URL=https://placeholder.upstash.io " +
  "UPSTASH_REDIS_REST_TOKEN=placeholder " +
  "CRON_SECRET=placeholder " +
  "NODE_ENV=production";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `${webServerEnv} npm run start -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
