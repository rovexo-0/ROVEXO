#!/usr/bin/env node

import { readFileSync } from "node:fs";

const REQUIRED = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", group: "Supabase", aliases: ["SUPABASE_URL"] },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    group: "Supabase",
    aliases: ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    group: "Supabase",
    secret: true,
    aliases: ["SUPABASE_SECRET_KEY"],
  },
  { key: "NEXT_PUBLIC_APP_URL", group: "App" },
  { key: "STRIPE_SECRET_KEY", group: "Stripe", secret: true },
  { key: "STRIPE_WEBHOOK_SECRET", group: "Stripe Webhook", secret: true },
  { key: "RESEND_API_KEY", group: "Resend", secret: true },
  { key: "EMAIL_FROM", group: "Resend" },
  { key: "UPSTASH_REDIS_REST_URL", group: "Upstash Redis" },
  { key: "UPSTASH_REDIS_REST_TOKEN", group: "Upstash Redis", secret: true },
  { key: "CRON_SECRET", group: "Cron", secret: true },
];

const SUPABASE_HOSTNAME_CORRECTIONS = {
  "pklotmwxtnnnepaitedic.supabase.co": "pklotmwxtnnepaitedic.supabase.co",
};

function normalizeSupabaseUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`Invalid Supabase URL: "${trimmed}" is not a valid URL.`);
  }

  if (!url.hostname.endsWith(".supabase.co")) {
    throw new Error(
      `Invalid Supabase URL hostname "${url.hostname}". Expected https://<project-ref>.supabase.co`,
    );
  }

  if (url.hostname.includes("pooler.") || url.hostname.includes("supabase.com")) {
    throw new Error(
      `Invalid Supabase URL hostname "${url.hostname}". Use https://<project-ref>.supabase.co, not the database pooler URL.`,
    );
  }

  const corrected = SUPABASE_HOSTNAME_CORRECTIONS[url.hostname];
  if (corrected) {
    url.hostname = corrected;
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("Invalid Supabase URL: use the project origin only (no path).");
  }

  return url.origin;
}

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    const map = new Map();
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      map.set(key, value);
    }
    return map;
  } catch {
    return new Map();
  }
}

const fromFile = loadEnvFile(".env.local");
const present = [];
const missing = [];

function hasEnvValue(item, fromFile) {
  const names = [item.key, ...(item.aliases ?? [])];
  return names.some((name) => {
    const value = process.env[name] ?? fromFile.get(name);
    return Boolean(value?.trim());
  });
}

for (const item of REQUIRED) {
  if (hasEnvValue(item, fromFile)) {
    present.push(item);
  } else {
    missing.push(item);
  }
}

console.log("ROVEXO production environment verification\n");
console.log(`Present (${present.length}/${REQUIRED.length}):`);
for (const item of present) {
  console.log(`  ✓ ${item.key} [${item.group}]`);
}

if (missing.length) {
  console.log(`\nMissing (${missing.length}):`);
  for (const item of missing) {
    console.log(`  ✗ ${item.key} [${item.group}]`);
  }
  process.exitCode = 1;
} else {
  console.log("\nAll required production environment variables are set.");
}

const appUrlRaw = process.env.NEXT_PUBLIC_APP_URL ?? fromFile.get("NEXT_PUBLIC_APP_URL");

if (appUrlRaw?.trim()) {
  try {
    const appUrl = new URL(
      /^https?:\/\//i.test(appUrlRaw.trim()) ? appUrlRaw.trim() : `https://${appUrlRaw.trim()}`,
    );

    if (appUrl.protocol !== "https:") {
      throw new Error(`NEXT_PUBLIC_APP_URL must use https in production (${appUrl.href}).`);
    }

    if (appUrl.pathname !== "/" && appUrl.pathname !== "") {
      throw new Error("NEXT_PUBLIC_APP_URL must not include a path.");
    }

    console.log(`\nApp URL: ${appUrl.origin}`);
  } catch (error) {
    console.log("\nApp URL validation: FAIL");
    console.log(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

const supabaseUrlRaw =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  fromFile.get("SUPABASE_URL") ??
  fromFile.get("NEXT_PUBLIC_SUPABASE_URL");

if (supabaseUrlRaw?.trim()) {
  try {
    const normalized = normalizeSupabaseUrl(supabaseUrlRaw);
    console.log(`\nSupabase URL: ${normalized}`);

    const { lookup } = await import("node:dns/promises");
    const hostname = new URL(normalized).hostname;
    await lookup(hostname);
    console.log(`Supabase DNS: PASS (${hostname} resolves)`);
  } catch (error) {
    console.log("\nSupabase URL validation: FAIL");
    console.log(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
