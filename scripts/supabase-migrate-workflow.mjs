#!/usr/bin/env node
/**
 * ROVEXO Supabase migration workflow automation.
 * Scans, validates, applies (when authenticated), verifies, and regenerates types.
 *
 * Usage:
 *   node scripts/supabase-migrate-workflow.mjs
 *   SUPABASE_ACCESS_TOKEN=... node scripts/supabase-migrate-workflow.mjs
 *   SUPABASE_DB_PASSWORD=... node scripts/supabase-migrate-workflow.mjs
 */

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");
const PROJECT_REF = "pklotmwxtnnepaitedic";
const REPORT_PATH = join(ROOT, "supabase/migration-report.json");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const supabaseCmd = process.platform === "win32" ? "supabase.cmd" : "supabase";

function log(section, message) {
  console.log(`[${section}] ${message}`);
}

function run(command, options = {}) {
  return spawnSync(command, {
    shell: true,
    encoding: "utf8",
    cwd: ROOT,
    ...options,
  });
}

function runOrThrow(command, label, options = {}) {
  const result = run(command, { stdio: "pipe", ...options });
  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stdout}\n${result.stderr}`.trim());
  }
  return `${result.stdout}${result.stderr}`.trim();
}

function loadEnvFile(filename) {
  const path = join(ROOT, filename);
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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
    env[key] = value;
  }
  return env;
}

function scanMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const byVersion = new Map();
  const issues = [];

  for (const file of files) {
    const match = /^(\d{14})_(.+)\.sql$/.exec(file);
    if (!match) {
      issues.push({ type: "invalid_name", file, message: "Filename must match YYYYMMDDHHMMSS_name.sql" });
      continue;
    }

    const version = match[1];
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    if (!content.trim()) {
      issues.push({ type: "empty", file, message: "Migration file is empty" });
    }

    if (!byVersion.has(version)) byVersion.set(version, []);
    byVersion.get(version).push(file);
  }

  for (const [version, dupes] of byVersion.entries()) {
    if (dupes.length > 1) {
      issues.push({
        type: "duplicate_version",
        version,
        files: dupes,
        message: `Duplicate migration version prefix ${version}`,
      });
    }
  }

  return { files, issues };
}

function validateMigrationSyntax(files) {
  const issues = [];
  const patterns = [
    { name: "destructive_drop_table", regex: /drop\s+table\s+(?!if\s+exists)/gi },
    { name: "truncate_without_guard", regex: /truncate\s+table/gi },
    { name: "delete_without_where", regex: /delete\s+from\s+[^\n;]+;/gi },
    {
      name: "full_demo_account_delete",
      regex: /demo\.(buyer|seller)@rovexo\.co\.uk/gi,
    },
  ];

  for (const file of files) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const pattern of patterns) {
      if (pattern.name === "full_demo_account_delete") {
        const mentionsDemo = pattern.regex.test(content);
        pattern.regex.lastIndex = 0;
        if (
          mentionsDemo &&
          /(delete\s+from\s+profiles|auth\.users|delete\s+user|drop\s+user)/i.test(content)
        ) {
          issues.push({
            type: "full_demo_block",
            file,
            message:
              "Migration must never delete or disable Full Demo Accounts (demo.buyer@rovexo.co.uk / demo.seller@rovexo.co.uk)",
          });
        }
        continue;
      }

      if (pattern.regex.test(content)) {
        issues.push({
          type: "safety_warning",
          file,
          message: `Contains potentially unsafe pattern: ${pattern.name}`,
        });
      }
      pattern.regex.lastIndex = 0;
    }

    const openParens = (content.match(/\(/g) ?? []).length;
    const closeParens = (content.match(/\)/g) ?? []).length;
    if (openParens !== closeParens) {
      issues.push({ type: "syntax_warning", file, message: "Unbalanced parentheses" });
    }
  }

  return issues;
}

function getSupabaseAdmin() {
  const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const REQUIRED_TABLES = [
  "profiles",
  "user_settings",
  "shipping_addresses",
  "payment_methods",
  "seller_shipping_settings",
  "buyer_preferences",
  "notification_settings",
  "live_visitor_sessions",
  "platform_audit_logs",
  "orders",
  "products",
  "messages",
  "notifications",
  "saved_items",
  "saved_searches",
  "recently_viewed",
  "seller_follows",
  "wallets",
  "wallet_transactions",
  "stripe_webhook_events",
  "trust_scores",
  "business_profiles",
  "monetization_plans",
  "push_subscriptions",
  "cart_items",
  "reviews",
  "email_outbox",
  "listing_promotions",
  "platform_error_logs",
  "search_logs",
];

async function verifyRemoteTables(admin) {
  const results = [];
  for (const table of REQUIRED_TABLES) {
    const { error } = await admin.from(table).select("*", { head: true, count: "exact" }).limit(1);
    results.push({
      table,
      exists: !error || !/does not exist|schema cache/i.test(error.message),
      error: error?.message ?? null,
    });
  }
  return results;
}

async function verifyLiveAnalyticsColumns(admin) {
  const { error } = await admin
    .from("live_visitor_sessions")
    .select("city, device_category, browser, operating_system, traffic_source")
    .limit(1);
  return {
    ok: !error,
    error: error?.message ?? null,
  };
}

function ensureLinked() {
  const linkedPath = join(ROOT, "supabase/.temp/linked-project.json");
  if (!existsSync(linkedPath)) {
    runOrThrow(`${supabaseCmd} link --project-ref ${PROJECT_REF} --yes`, "supabase link");
    return;
  }
  const linked = JSON.parse(readFileSync(linkedPath, "utf8"));
  if (linked.ref !== PROJECT_REF) {
    runOrThrow(`${supabaseCmd} link --project-ref ${PROJECT_REF} --yes`, "supabase link");
  }
}

function applyMigrations(env) {
  const token = env.SUPABASE_ACCESS_TOKEN;
  const dbPassword = env.SUPABASE_DB_PASSWORD;
  const pushEnv = { ...process.env, ...env };

  if (token) {
    log("apply", "Using SUPABASE_ACCESS_TOKEN for supabase db push");
    return runOrThrow(`${supabaseCmd} db push --linked --yes`, "supabase db push", { env: pushEnv });
  }

  if (dbPassword) {
    log("apply", "Using SUPABASE_DB_PASSWORD for supabase db push");
    return runOrThrow(
      `${supabaseCmd} db push --linked --yes -p "${dbPassword.replace(/"/g, '\\"')}"`,
      "supabase db push",
      { env: pushEnv },
    );
  }

  throw new Error(
    "Supabase authentication required. Set SUPABASE_ACCESS_TOKEN or SUPABASE_DB_PASSWORD, or run `supabase login` first.",
  );
}

function listRemoteMigrations(env) {
  const childEnv = { ...process.env, ...env };
  const result = run(`${supabaseCmd} migration list`, { env: childEnv, stdio: "pipe" });
  if (result.status !== 0) return null;
  return `${result.stdout}${result.stderr}`.trim();
}

function regenerateTypes(env) {
  const pushEnv = { ...process.env, ...env };
  const typesPath = join(ROOT, "lib/supabase/types/database.ts");
  const types = runOrThrow(`${supabaseCmd} gen types typescript --linked`, "supabase gen types", {
    env: pushEnv,
  });
  const withExports = `${types.trim()}\n\nexport type UserRole = Database["public"]["Enums"]["user_role"];\nexport type ProductStatus = Database["public"]["Enums"]["product_status"];\n`;
  writeFileSync(typesPath, withExports, "utf8");
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    repository: "ROVEXO",
    projectRef: PROJECT_REF,
    nodeVersion: run("node -v", { stdio: "pipe" }).stdout.trim(),
    npmVersion: run("npm -v", { stdio: "pipe" }).stdout.trim(),
    supabaseVersion: run(`${supabaseCmd} --version`, { stdio: "pipe" }).stdout.trim(),
    migrations: { total: 0, files: [], duplicateVersions: [], validationIssues: [] },
    apply: { attempted: false, success: false, output: null, skipped: 0 },
    verification: { tables: [], liveAnalyticsColumns: null },
    quality: { lint: null, typecheck: null, build: null },
    completedAt: null,
    productionReady: false,
  };

  log("step1", `Node ${report.nodeVersion}, npm ${report.npmVersion}`);
  log("step2", `Supabase CLI ${report.supabaseVersion}`);

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  if (pkg.name !== "rovexo") throw new Error("This does not appear to be the ROVEXO repository.");
  log("step4", "Verified ROVEXO repository");

  ensureLinked();
  log("step5", `Linked to project ${PROJECT_REF}`);

  const { files, issues } = scanMigrations();
  report.migrations.total = files.length;
  report.migrations.files = files;
  report.migrations.duplicateVersions = issues.filter((i) => i.type === "duplicate_version");
  report.migrations.validationIssues = [...issues, ...validateMigrationSyntax(files)];
  log("step6", `Detected ${files.length} migration files`);
  if (report.migrations.duplicateVersions.length) {
    log("warn", `Found ${report.migrations.duplicateVersions.length} duplicate version groups`);
  }

  const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
  let migrationList = null;
  try {
    migrationList = listRemoteMigrations(env);
    if (migrationList) log("step6", "Remote migration history retrieved");
  } catch {
    log("warn", "Could not read remote migration history (authentication required)");
  }
  report.migrations.remoteStatus = migrationList;

  let pushError = null;
  try {
    report.apply.attempted = true;
    report.apply.output = applyMigrations(env);
    report.apply.success = true;
    log("step8", "All pending migrations applied via supabase db push");
  } catch (error) {
    pushError = error instanceof Error ? error.message : String(error);
    report.apply.output = pushError;
    log("step8", `Migration push blocked: ${pushError}`);
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    report.verification.tables = await verifyRemoteTables(admin);
    report.verification.liveAnalyticsColumns = await verifyLiveAnalyticsColumns(admin);
    const missing = report.verification.tables.filter((row) => !row.exists);
    log("step9", `Remote table verification: ${report.verification.tables.length - missing.length}/${REQUIRED_TABLES.length} present`);
    if (missing.length) {
      log("warn", `Missing tables: ${missing.map((row) => row.table).join(", ")}`);
    }
  } else {
    log("warn", "Skipping remote table verification (Supabase URL/service key unavailable)");
  }

  if (report.apply.success) {
    try {
      regenerateTypes(env);
      log("step12", "Regenerated lib/supabase/types/database.ts");
      report.typesRegenerated = true;
    } catch (error) {
      report.typesRegenerated = false;
      report.typesError = error instanceof Error ? error.message : String(error);
      log("warn", `Type regeneration failed: ${report.typesError}`);
    }
  }

  log("step13", "Running npm install");
  runOrThrow(`${npmCmd} install`, "npm install");

  const quality = {};
  for (const step of ["lint", "typecheck", "build"]) {
    try {
      runOrThrow(`${npmCmd} run ${step}`, step);
      quality[step] = "PASS";
      log("step14", `npm run ${step} PASS`);
    } catch (error) {
      quality[step] = "FAIL";
      log("step14", `npm run ${step} FAIL`);
      throw error;
    }
  }
  report.quality = quality;

  report.completedAt = new Date().toISOString();
  report.productionReady =
    report.apply.success &&
    quality.lint === "PASS" &&
    quality.typecheck === "PASS" &&
    quality.build === "PASS" &&
    (report.verification.tables.length === 0 ||
      report.verification.tables.every((row) => row.exists));

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log("\n=== ROVEXO MIGRATION WORKFLOW REPORT ===");
  console.log(JSON.stringify(report, null, 2));

  if (!report.apply.success) {
    process.exit(2);
  }
  if (!report.productionReady) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
