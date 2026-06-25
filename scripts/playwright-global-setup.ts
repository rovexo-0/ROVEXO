import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadDotEnvFiles(cwd = process.cwd()) {
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(cwd, filename);
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function resolvePackageManager(cwd = process.cwd()) {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
    try {
      execSync(process.platform === "win32" ? "where pnpm" : "which pnpm", { stdio: "ignore" });
      return "pnpm";
    } catch {
      return "npm";
    }
  }
  return "npm";
}

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

  const port = process.env.PLAYWRIGHT_PORT ?? "3010";
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
    EMAIL_FROM: process.env.EMAIL_FROM ?? "ROVEXO <noreply@rovexo.com>",
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
