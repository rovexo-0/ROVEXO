import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadDotEnvFiles, resolvePackageManager } from "./playwright-env.mjs";

function hasProductionBuild(cwd = process.cwd()) {
  return fs.existsSync(path.join(cwd, ".next", "BUILD_ID"));
}

function runProductionBuild(env: NodeJS.ProcessEnv) {
  const pm = resolvePackageManager();
  execSync(`${pm} run build`, {
    stdio: "inherit",
    env: { ...process.env, ...env, NODE_ENV: "production" },
    cwd: process.cwd(),
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
  });
}

export default async function globalSetup() {
  loadDotEnvFiles();

  const port = process.env.PLAYWRIGHT_PORT ?? "13025";
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

  const buildEnv: NodeJS.ProcessEnv = {
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-RNEMD5BT0S",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      "placeholder",
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "placeholder",
    NEXT_PUBLIC_APP_URL: baseURL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_placeholder",
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_placeholder",
    EMAIL_FROM: process.env.EMAIL_FROM ?? "ROVEXO <support@rovexo.co.uk>",
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "https://placeholder.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "placeholder",
    CRON_SECRET: process.env.CRON_SECRET ?? "placeholder",
    PLAYWRIGHT_E2E: "1",
    NODE_ENV: "production",
  };

  if (!hasProductionBuild()) {
    console.log("[playwright] No production build found — running next build…");
    runProductionBuild(buildEnv);
  }
}
