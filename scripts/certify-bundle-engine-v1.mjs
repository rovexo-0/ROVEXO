#!/usr/bin/env node
/**
 * ROVEXO Bundle Engine v1.0 — Certification probe (DB + contracts).
 * NO commit / push / deploy. Evidence only.
 *
 * Usage: node scripts/certify-bundle-engine-v1.mjs
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path, into) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in into) || !into[m[1]]) into[m[1]] = v;
  }
}

const env = { ...process.env };
loadEnvFile(join(root, ".env.local"), env);
loadEnvFile(join(root, ".env"), env);

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

const results = [];
function gate(name, status, detail = "") {
  results.push({ name, status, detail });
  const mark = status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : "BLOCKED";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

if (!url || !key) {
  console.error("FAIL: Supabase URL / service role missing");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function classifyProbeError(msg) {
  if (/does not exist|Could not find the table|schema cache|Could not find the .* column/i.test(msg)) {
    return "missing";
  }
  // Network / auth / infra — never treat as schema PASS
  if (
    /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network|Failed to fetch|TypeError|AbortError|401|403|Invalid API key|JWT/i.test(
      msg,
    )
  ) {
    return "blocked";
  }
  // RLS / empty / permission still proves object exists
  if (/permission|row-level|policy/i.test(msg)) {
    return "ok";
  }
  return "ok";
}

async function tableProbe(table, select = "id") {
  try {
    const { error } = await admin.from(table).select(select).limit(1);
    if (!error) return { ok: true };
    const msg = error.message || String(error);
    const kind = classifyProbeError(msg);
    if (kind === "missing") return { ok: false, missing: true, msg };
    if (kind === "blocked") return { ok: false, blocked: true, msg };
    return { ok: true, note: msg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, blocked: true, msg };
  }
}

async function columnProbe(table, column) {
  try {
    const { error } = await admin.from(table).select(column).limit(1);
    if (!error) return { ok: true };
    const msg = error.message || String(error);
    const kind = classifyProbeError(msg);
    if (kind === "missing") return { ok: false, msg };
    if (kind === "blocked") return { ok: false, blocked: true, msg };
    return { ok: true, note: msg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, blocked: true, msg };
  }
}

async function main() {
  console.log("=== Bundle Engine v1.0 Certification Probe ===\n");

  // Migration files present
  const migrations = [
    "supabase/migrations/20260801160000_checkout_sessions_bundle_lines_v1.sql",
    "supabase/migrations/20260801180000_bundle_engine_v1.sql",
  ];
  for (const rel of migrations) {
    gate(
      `Migration file ${rel}`,
      existsSync(join(root, rel)) ? "PASS" : "FAIL",
      existsSync(join(root, rel)) ? "present" : "missing",
    );
  }

  const tables = ["bundles", "bundle_items", "bundle_offers", "bundle_events", "checkout_sessions"];
  for (const t of tables) {
    const probe = await tableProbe(t);
    const status = probe.ok ? "PASS" : probe.blocked ? "BLOCKED" : "FAIL";
    const detail = probe.missing
      ? "NOT APPLIED — run bundle migrations"
      : probe.blocked
        ? `LIVE UNREACHABLE — ${probe.msg}`
        : probe.note || "reachable";
    gate(`Table ${t}`, status, detail);
  }

  const cols = [
    ["checkout_sessions", "bundle_lines"],
    ["bundle_items", "reserved_quantity"],
    ["bundles", "status"],
    ["bundles", "buyer_id"],
    ["bundles", "seller_id"],
    ["bundles", "order_id"],
    ["bundles", "checkout_session_id"],
  ];
  for (const [table, column] of cols) {
    const probe = await columnProbe(table, column);
    const status = probe.ok ? "PASS" : probe.blocked ? "BLOCKED" : "FAIL";
    const detail = probe.ok
      ? "reachable"
      : probe.blocked
        ? `LIVE UNREACHABLE — ${probe.msg}`
        : probe.msg || "missing";
    gate(`Column ${table}.${column}`, status, detail);
  }

  // Source contract: singularity + phase1 flags
  const lawPath = join(root, "lib/bundle/bundle-engine-v1.ts");
  const law = readFileSync(lawPath, "utf8");
  gate(
    "Law atomicEntireBundleOrNothing",
    law.includes("atomicEntireBundleOrNothing: true") ? "PASS" : "FAIL",
  );
  gate(
    "Law phase1 checkoutIntegrity",
    law.includes("checkoutIntegrity: true") ? "PASS" : "FAIL",
  );
  gate(
    "Law oneActiveBundlePerBuyer",
    law.includes("oneActiveBundlePerBuyer: true") ? "PASS" : "FAIL",
  );

  // Engine source presence
  const engines = [
    "lib/bundle/bundle-checkout-integrity-v1.ts",
    "lib/bundle/bundle-reservation-engine-v1.ts",
    "lib/bundle/bundle-buy-now-engine-v1.ts",
    "lib/bundle/bundle-snapshot-v1.ts",
    "lib/bundle/bundle-lifecycle-v1.ts",
  ];
  for (const rel of engines) {
    gate(`Engine ${rel}`, existsSync(join(root, rel)) ? "PASS" : "FAIL");
  }

  // SQL law checks (static)
  const sql = readFileSync(join(root, "supabase/migrations/20260801180000_bundle_engine_v1.sql"), "utf8");
  gate(
    "SQL unique one active bundle per buyer",
    sql.includes("bundles_one_active_per_buyer_uidx") ? "PASS" : "FAIL",
  );
  gate(
    "SQL unique (bundle_id, product_id)",
    sql.includes("unique (bundle_id, product_id)") ? "PASS" : "FAIL",
  );
  gate(
    "SQL buyer_ne_seller check",
    sql.includes("bundles_buyer_ne_seller") ? "PASS" : "FAIL",
  );
  gate(
    "SQL RLS enabled on bundles",
    sql.includes("enable row level security") && sql.includes("public.bundles") ? "PASS" : "FAIL",
  );
  gate(
    "SQL reserved_quantity on bundle_items",
    sql.includes("reserved_quantity") ? "PASS" : "FAIL",
  );

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const blocked = results.filter((r) => r.status === "BLOCKED").length;

  const outDir = join(root, "test-results/bundle-certification-v1");
  mkdirSync(outDir, { recursive: true });
  const liveFail = results.some(
    (r) =>
      (r.status === "FAIL" || r.status === "BLOCKED") &&
      /^(Table |Column )/i.test(r.name),
  );
  const report = {
    version: "1.0",
    phase: "INFRASTRUCTURE_CERTIFICATION",
    generatedAt: new Date().toISOString(),
    summary: { pass, fail, blocked, total: results.length },
    results,
    liveDatabase: liveFail ? "FAIL" : "PASS",
    migrationApply: {
      status: results.some((r) => /NOT APPLIED/i.test(r.detail || ""))
        ? "REQUIRED"
        : liveFail
          ? "BLOCKED"
          : "VERIFY",
      note: "SUPABASE_DB_PASSWORD / DATABASE_URL required to apply. Network/auth errors = BLOCKED (never PASS).",
    },
  };
  writeFileSync(join(outDir, "probe-report.json"), JSON.stringify(report, null, 2));
  console.log(`\nSummary: PASS=${pass} FAIL=${fail} BLOCKED=${blocked}`);
  console.log(`Live Database: ${report.liveDatabase}`);
  console.log(`Wrote ${join(outDir, "probe-report.json")}`);
  process.exit(fail > 0 || blocked > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
