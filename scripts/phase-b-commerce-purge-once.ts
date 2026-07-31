/**
 * Phase B — one-shot commerce/orders purge for zero-demo launch.
 *
 * NOT a migration. Does not alter schema, indexes, RBAC, or auth.
 * Bypasses append-only triggers only inside one transaction via
 * session_replication_role = replica, then restores normal role.
 *
 * Requires:
 *   LAUNCH_RESET_OWNER_APPROVED=1
 *   DATABASE_URL or SUPABASE_DB_PASSWORD (+ pooler URL)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { loadDotEnvFiles } from "./playwright-env.mjs";

loadDotEnvFiles();

const require = createRequire(import.meta.url);
const { Client } = require("pg") as typeof import("pg");

const OWNER_APPROVED = process.env.LAUNCH_RESET_OWNER_APPROVED === "1";
const root = join(import.meta.dirname, "..");

function resolveConnectionString(): string {
  const direct =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    "";
  if (direct) return direct;

  const poolerPath = join(root, "supabase/.temp/pooler-url");
  if (!existsSync(poolerPath)) {
    throw new Error("No DATABASE_URL and no supabase/.temp/pooler-url");
  }
  const u = new URL(readFileSync(poolerPath, "utf8").trim());
  if (!u.password && process.env.SUPABASE_DB_PASSWORD) {
    u.password = process.env.SUPABASE_DB_PASSWORD;
  }
  if (!u.password) {
    throw new Error("Database password missing (SUPABASE_DB_PASSWORD or DATABASE_URL)");
  }
  return u.toString();
}

/** Tables that block order deletes via immutability / cascade. */
const LEDGER_THEN_ORDERS = [
  "resolution_events",
  "resolution_cases",
  "refund_events",
  "escrow_events",
  "shipping_transactions",
  "shipping_reserve",
  "commerce_audit_logs",
  "orders",
] as const;

async function count(client: InstanceType<typeof Client>, table: string): Promise<number> {
  const { rows } = await client.query(`select count(*)::int as c from public.${table}`);
  return rows[0]?.c ?? 0;
}

async function main() {
  if (!OWNER_APPROVED) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "Set LAUNCH_RESET_OWNER_APPROVED=1 after Owner approval.",
      }),
    );
    process.exit(2);
  }

  const connectionString = resolveConnectionString();
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const before: Record<string, number> = {};
  for (const table of LEDGER_THEN_ORDERS) {
    try {
      before[table] = await count(client, table);
    } catch {
      before[table] = -1;
    }
  }

  await client.query("begin");
  try {
    await client.query("set local session_replication_role = replica");
    for (const table of LEDGER_THEN_ORDERS) {
      if (before[table] < 0) continue;
      await client.query(`delete from public.${table}`);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    await client.end();
    console.log(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        before,
      }),
    );
    process.exit(1);
  }

  const after: Record<string, number> = {};
  let zeroPass = true;
  for (const table of LEDGER_THEN_ORDERS) {
    if (before[table] < 0) {
      after[table] = -1;
      continue;
    }
    after[table] = await count(client, table);
    if (after[table] !== 0) zeroPass = false;
  }

  // Inbox / notifications / offers — confirm still empty
  const verifyExtra = [
    "conversations",
    "messages",
    "notifications",
    "offers",
    "wallet_transactions",
  ] as const;
  const extras: Record<string, number> = {};
  for (const table of verifyExtra) {
    extras[table] = await count(client, table);
    if (extras[table] !== 0) zeroPass = false;
  }

  await client.end();

  console.log(
    JSON.stringify(
      {
        ok: zeroPass,
        mode: "PHASE_B_COMMERCE_PURGE",
        schemaChanged: false,
        migrationsChanged: false,
        before,
        after,
        inboxAndOffers: extras,
        passFail: zeroPass ? "PASS" : "FAIL",
      },
      null,
      2,
    ),
  );
  process.exit(zeroPass ? 0 : 1);
}

main().catch((error) => {
  console.log(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
