#!/usr/bin/env node
/**
 * Production environment verification for ROVEXO.
 * Loads .env.local / .env, checks required variables, validates URLs.
 *
 * Usage: npm run verify:env
 */

import { readFileSync, existsSync } from "node:fs";
import { lookup } from "node:dns/promises";
import { resolve } from "node:path";

type EnvSpec = {
  key: string;
  group: string;
  required: boolean;
  secret?: boolean;
  aliases?: string[];
  example: string;
  description: string;
};

const REQUIRED_SPECS: EnvSpec[] = [
  {
    key: "NEXT_PUBLIC_APP_URL",
    group: "App",
    required: true,
    example: "https://rovexo.com",
    description: "Canonical HTTPS URL for redirects, Stripe return URLs, sitemap, and metadata.",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    group: "Supabase",
    required: true,
    aliases: ["SUPABASE_URL"],
    example: "https://<project-ref>.supabase.co",
    description: "Supabase project API URL (client + server).",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    group: "Supabase",
    required: true,
    aliases: ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
    example: "sb_publishable_<key>",
    description: "Supabase anonymous/publishable key for browser auth.",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    group: "Supabase",
    required: true,
    secret: true,
    aliases: ["SUPABASE_SECRET_KEY"],
    example: "sb_secret_<key>",
    description: "Supabase service role key for admin/server operations.",
  },
  {
    key: "STRIPE_SECRET_KEY",
    group: "Stripe",
    required: true,
    secret: true,
    example: "sk_live_<key>",
    description: "Stripe secret API key (use sk_live_ in production).",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    group: "Stripe",
    required: true,
    secret: true,
    example: "whsec_<key>",
    description: "Stripe webhook signing secret for /api/stripe/webhook and /api/webhooks/stripe.",
  },
  {
    key: "RESEND_API_KEY",
    group: "Email (Resend)",
    required: true,
    secret: true,
    example: "re_<key>",
    description: "Resend API key for transactional email.",
  },
  {
    key: "EMAIL_FROM",
    group: "Email (Resend)",
    required: true,
    example: "ROVEXO <noreply@rovexo.com>",
    description: "Verified sender address in Resend.",
  },
  {
    key: "UPSTASH_REDIS_REST_URL",
    group: "Upstash Redis",
    required: true,
    example: "https://<name>-<id>.upstash.io",
    description: "Upstash Redis REST URL for production rate limiting.",
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    group: "Upstash Redis",
    required: true,
    secret: true,
    example: "<token>",
    description: "Upstash Redis REST token.",
  },
  {
    key: "CRON_SECRET",
    group: "Cron",
    required: true,
    secret: true,
    example: "<secure-random-string>",
    description: "Bearer token for /api/cron/* routes (Vercel Cron).",
  },
  {
    key: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    group: "Analytics",
    required: true,
    example: "G-XXXXXXXXXX",
    description: "Google Analytics 4 measurement ID.",
  },
];

const OPTIONAL_SPECS: EnvSpec[] = [
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    group: "Stripe",
    required: false,
    example: "pk_live_<key>",
    description:
      "Optional. Not used by Stripe Hosted Checkout in ROVEXO v1.0; only needed if client-side Stripe.js is added later.",
  },
  {
    key: "NEXT_PUBLIC_SITE_URL",
    group: "App",
    required: false,
    example: "https://rovexo.com",
    description: "Optional SEO fallback; defaults to https://rovexo.com.",
  },
  {
    key: "OPENAI_API_KEY",
    group: "AI Camera",
    required: false,
    secret: true,
    example: "sk-<key>",
    description: "Optional. Required only when AI camera vision is enabled.",
  },
];

const SUPABASE_HOSTNAME_CORRECTIONS: Record<string, string> = {
  "pklotmwxtnnnepaitedic.supabase.co": "pklotmwxtnnepaitedic.supabase.co",
};

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function loadEnvFile(filePath: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(filePath)) {
    return map;
  }

  const raw = readFileSync(filePath, "utf8");
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
    map.set(key, value);
  }
  return map;
}

function resolveEnvValue(key: string, aliases: string[] | undefined, fileEnv: Map<string, string>): {
  value: string | undefined;
  source: string | undefined;
} {
  const names = [key, ...(aliases ?? [])];
  for (const name of names) {
    const fromProcess = process.env[name]?.trim();
    if (fromProcess) {
      return { value: fromProcess, source: `process.env.${name}` };
    }
  }
  for (const name of names) {
    const fromFile = fileEnv.get(name)?.trim();
    if (fromFile) {
      return { value: fromFile, source: `.env* (${name})` };
    }
  }
  return { value: undefined, source: undefined };
}

function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(candidate);

  if (!url.hostname.endsWith(".supabase.co")) {
    throw new Error(
      `Invalid Supabase hostname "${url.hostname}". Expected https://<project-ref>.supabase.co`,
    );
  }

  if (url.hostname.includes("pooler.") || url.hostname.includes("supabase.com")) {
    throw new Error("Use the Supabase API URL, not the database pooler URL.");
  }

  const corrected = SUPABASE_HOSTNAME_CORRECTIONS[url.hostname];
  if (corrected) {
    url.hostname = corrected;
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("Supabase URL must not include a path.");
  }

  return url.origin;
}

function printHeader(title: string) {
  console.log(`\n${c.bold}${c.cyan}${title}${c.reset}`);
}

function printPass(key: string, group: string, source?: string) {
  const src = source ? ` ${c.dim}(${source})${c.reset}` : "";
  console.log(`  ${c.green}✓${c.reset} ${c.bold}${key}${c.reset} ${c.dim}[${group}]${c.reset}${src}`);
}

function printFail(key: string, group: string, example: string) {
  console.log(
    `  ${c.red}✗${c.reset} ${c.bold}${key}${c.reset} ${c.dim}[${group}]${c.reset} — e.g. ${c.yellow}${example}${c.reset}`,
  );
}

function printOptional(key: string, group: string, present: boolean) {
  const mark = present ? `${c.green}✓${c.reset}` : `${c.dim}–${c.reset}`;
  console.log(`  ${mark} ${key} ${c.dim}[${group}] optional${c.reset}`);
}

async function main() {
  const cwd = process.cwd();
  const fileEnv = new Map<string, string>();
  for (const file of [".env.local", ".env"]) {
    const loaded = loadEnvFile(resolve(cwd, file));
    for (const [k, v] of loaded) {
      if (!fileEnv.has(k)) {
        fileEnv.set(k, v);
      }
    }
  }

  console.log(`${c.bold}ROVEXO production environment verification${c.reset}`);
  console.log(`${c.dim}Scans: process.env + .env.local + .env${c.reset}`);

  const presentRequired: Array<{ spec: EnvSpec; source: string }> = [];
  const missingRequired: EnvSpec[] = [];

  printHeader(`Required (${REQUIRED_SPECS.length})`);

  for (const spec of REQUIRED_SPECS) {
    const { value, source } = resolveEnvValue(spec.key, spec.aliases, fileEnv);
    if (value) {
      presentRequired.push({ spec, source: source ?? "unknown" });
      printPass(spec.key, spec.group, source);
    } else {
      missingRequired.push(spec);
      printFail(spec.key, spec.group, spec.example);
    }
  }

  printHeader(`Optional (${OPTIONAL_SPECS.length})`);
  for (const spec of OPTIONAL_SPECS) {
    const { value } = resolveEnvValue(spec.key, spec.aliases, fileEnv);
    printOptional(spec.key, spec.group, Boolean(value));
  }

  let validationFailed = false;

  const appUrlResolved = resolveEnvValue("NEXT_PUBLIC_APP_URL", undefined, fileEnv);
  if (appUrlResolved.value) {
    printHeader("App URL validation");
    try {
      const appUrl = new URL(
        /^https?:\/\//i.test(appUrlResolved.value)
          ? appUrlResolved.value
          : `https://${appUrlResolved.value}`,
      );
      if (appUrl.protocol !== "https:") {
        throw new Error(`NEXT_PUBLIC_APP_URL must use https (got ${appUrl.protocol})`);
      }
      if (appUrl.pathname !== "/" && appUrl.pathname !== "") {
        throw new Error("NEXT_PUBLIC_APP_URL must not include a path.");
      }
      console.log(`  ${c.green}✓${c.reset} ${appUrl.origin}`);
    } catch (error) {
      validationFailed = true;
      console.log(
        `  ${c.red}✗${c.reset} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const supabaseResolved = resolveEnvValue("NEXT_PUBLIC_SUPABASE_URL", ["SUPABASE_URL"], fileEnv);
  if (supabaseResolved.value) {
    printHeader("Supabase URL validation");
    try {
      const normalized = normalizeSupabaseUrl(supabaseResolved.value);
      await lookup(new URL(normalized).hostname);
      console.log(`  ${c.green}✓${c.reset} ${normalized}`);
      console.log(`  ${c.green}✓${c.reset} DNS resolves`);
    } catch (error) {
      validationFailed = true;
      console.log(
        `  ${c.red}✗${c.reset} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const stripeKey = resolveEnvValue("STRIPE_SECRET_KEY", undefined, fileEnv).value;
  if (stripeKey) {
    printHeader("Stripe key mode");
    if (stripeKey.startsWith("sk_live_")) {
      console.log(`  ${c.green}✓${c.reset} Live mode (sk_live_)`);
    } else if (stripeKey.startsWith("sk_test_")) {
      console.log(`  ${c.yellow}⚠${c.reset} Test mode (sk_test_) — use sk_live_ in production`);
    } else {
      console.log(`  ${c.yellow}⚠${c.reset} Unrecognized Stripe key prefix`);
    }
  }

  printHeader("Summary");
  console.log(`  Present: ${c.green}${presentRequired.length}${c.reset} / ${REQUIRED_SPECS.length}`);
  console.log(`  Missing: ${missingRequired.length ? c.red : c.green}${missingRequired.length}${c.reset}`);

  const ready = missingRequired.length === 0 && !validationFailed;
  console.log(
    `\n${c.bold}Ready for production:${c.reset} ${ready ? `${c.green}YES${c.reset}` : `${c.red}NO${c.reset}`}\n`,
  );

  if (!ready) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${c.red}verify-env failed:${c.reset}`, error);
  process.exit(1);
});
