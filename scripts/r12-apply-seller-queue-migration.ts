/**
 * R1.2 — Apply seller_performance_event_queue repair + PostgREST schema reload.
 * Uses the Supabase SQL HTTP API when SUPABASE_ACCESS_TOKEN + project ref are present,
 * otherwise prints the SQL for Owner dashboard execution.
 *
 *   npx tsx scripts/r12-apply-seller-queue-migration.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATION = join(
  ROOT,
  "supabase/migrations/20260804140000_seller_performance_queue_pgrst_reload_r12.sql",
);

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() ||
  (url.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "");

async function verifyQueue(): Promise<{ ok: boolean; detail: string }> {
  if (!url || !serviceKey) return { ok: false, detail: "missing service role env" };
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error, count } = await admin
    .from("seller_performance_event_queue")
    .select("id", { count: "exact", head: true });
  if (error) {
    return { ok: false, detail: `${error.code ?? "ERR"} ${error.message}` };
  }
  return { ok: true, detail: `OK count=${count ?? 0}` };
}

async function main() {
  const sql = readFileSync(MIGRATION, "utf8");
  const before = await verifyQueue();
  console.log("BEFORE", before);

  let applied = false;
  let applyDetail = "";

  if (accessToken && projectRef) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    applyDetail = await res.text();
    applied = res.ok;
    console.log("MANAGEMENT_API", res.status, applyDetail.slice(0, 500));
  } else {
    applyDetail =
      "No SUPABASE_ACCESS_TOKEN — open Supabase SQL Editor and run migration file, then re-run this script.";
    console.log(applyDetail);
    console.log("--- SQL START ---");
    console.log(sql);
    console.log("--- SQL END ---");
  }

  // Always re-verify (Owner may have applied SQL manually between runs).
  const after = await verifyQueue();
  console.log("AFTER", after);

  const report = {
    status: after.ok ? "PASS" : "FAIL",
    before,
    after,
    applied,
    applyDetail: applyDetail.slice(0, 2000),
    migration: "20260804140000_seller_performance_queue_pgrst_reload_r12.sql",
  };
  writeFileSync(join(ROOT, "ROVEXO_R12_SELLER_QUEUE_MIGRATION_REPORT.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(after.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
