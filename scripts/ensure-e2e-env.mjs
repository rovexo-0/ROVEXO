#!/usr/bin/env node
/**
 * Absolute Final — E2E env gate.
 * Public URL + anon/publishable key are required.
 * Service role is optional: when missing, E2E continues in demo_session mode
 * (no production secret retrieval / env pull).
 */
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const requiredPublic = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function isUnusable(value) {
  const v = (value ?? "").trim();
  if (!v) return true;
  if (v === "[SENSITIVE]" || v.startsWith("[SEN")) return true;
  if (v === "placeholder" || v.endsWith("_placeholder")) return true;
  return false;
}

const env = { ...loadEnv(envPath), ...process.env };
const failures = [];

for (const key of requiredPublic) {
  const value = (env[key] ?? "").trim();
  if (isUnusable(value)) {
    failures.push(`${key} missing or unusable`);
    continue;
  }
  if (key.includes("URL") && !/^https?:\/\//.test(value)) {
    failures.push(`${key} is not a valid URL`);
  }
  if (key.includes("KEY") && value.length < 40) {
    failures.push(`${key} looks too short for a Supabase secret`);
  }
}

const serviceRole = (env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY ?? "").trim();
const hasServiceRole =
  !isUnusable(serviceRole) &&
  !serviceRole.startsWith("sb_publishable") &&
  serviceRole.length >= 40;

if (failures.length) {
  console.error("[ensure-e2e-env] FAIL");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(
    "Fix: set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (no production secret pull).",
  );
  process.exit(1);
}

if (!hasServiceRole) {
  console.warn(
    "[ensure-e2e-env] WARN — SUPABASE_SERVICE_ROLE_KEY missing; continuing in demo_session mode (admin E2E suites will self-skip).",
  );
  process.env.ROVEXO_E2E_MODE = "demo_session";
} else {
  console.log("[ensure-e2e-env] OK — Playwright certification secrets present (service_role mode)");
}

console.log("[ensure-e2e-env] OK — public Supabase credentials present");
process.exit(0);
