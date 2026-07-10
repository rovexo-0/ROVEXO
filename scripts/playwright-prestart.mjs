#!/usr/bin/env node
/**
 * Playwright web-server entrypoint.
 * Ensures a production build exists, then starts `next start` on the given port.
 * Cross-platform (Windows + Unix).
 */
import { spawn } from "node:child_process";
import net from "node:net";
import { loadDotEnvFiles, resolvePackageManager } from "./playwright-env.mjs";
import { ensureProductionBuild } from "./playwright-webserver.mjs";

loadDotEnvFiles();

const port = process.argv[2] ?? process.env.PLAYWRIGHT_PORT ?? "13025";
const pm = resolvePackageManager();

function assertPortFree(listenPort) {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", (error) => {
        if (error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE") {
          reject(
            new Error(
              `[playwright] Port ${listenPort} is already in use. Stop the stale server or set PLAYWRIGHT_PORT.`,
            ),
          );
          return;
        }
        reject(error);
      })
      .once("listening", () => tester.close(() => resolve()))
      .listen(Number(listenPort), "127.0.0.1");
  });
}

const webServerEnv = {  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-RNEMD5BT0S",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "placeholder",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "placeholder",
  NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_placeholder",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_placeholder",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "ROVEXO <support@rovexo.co.uk>",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "https://placeholder.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "placeholder",
  CRON_SECRET: process.env.CRON_SECRET ?? "placeholder",
  SENDCLOUD_PUBLIC_KEY: process.env.SENDCLOUD_PUBLIC_KEY ?? "sendcloud_public_test_placeholder",
  SENDCLOUD_SECRET_KEY: process.env.SENDCLOUD_SECRET_KEY ?? "sendcloud_secret_test_placeholder",
  PLAYWRIGHT_E2E: "1",
  ROVEXO_HOMEPAGE_DEMO: "1",
  NODE_ENV: "production",
};

await assertPortFree(port);
ensureProductionBuild(webServerEnv);

const child = spawn(`${pm} run start -- -p ${port}`, {
  stdio: "inherit",
  env: { ...process.env, ...webServerEnv },
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
