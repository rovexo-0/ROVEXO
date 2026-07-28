/**
 * BLOOD V — scoped order ledger probe (single order only).
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ORDER_ID = "319ca2fc-ac24-42cb-884e-ae3c3c7e2d34";
const ORDER_NUMBER = "RVX7512FF91";
const SELLER_ID = "8346d7b6-19e9-4e93-a60a-fb93452a19ad";
const OUT = path.join(process.cwd(), "test-results", "blood-v");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

async function main() {
  loadEnvLocal();
  fs.mkdirSync(OUT, { recursive: true });
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const escrow = await c
    .from("escrow_events")
    .select("id, event_type, from_state, to_state, reason, amount, created_at")
    .eq("order_id", ORDER_ID)
    .order("created_at", { ascending: true });

  const saleByNumber = await c
    .from("wallet_transactions")
    .select(
      "id, type, status, amount, fee_amount, description, order_number, stripe_transfer_id, idempotency_key, created_at, user_id",
    )
    .eq("user_id", SELLER_ID)
    .eq("order_number", ORDER_NUMBER);

  const saleByDesc = await c
    .from("wallet_transactions")
    .select(
      "id, type, status, amount, fee_amount, description, order_number, stripe_transfer_id, idempotency_key, created_at, user_id",
    )
    .eq("user_id", SELLER_ID)
    .eq("type", "sale")
    .ilike("description", `%${ORDER_ID}%`);

  const wallet = await c
    .from("wallets")
    .select("id, user_id, pending_balance, available_balance, locked_balance")
    .eq("user_id", SELLER_ID)
    .maybeSingle();

  const report = {
    orderId: ORDER_ID,
    orderNumber: ORDER_NUMBER,
    escrow: escrow.data,
    escrowError: escrow.error?.message ?? null,
    saleByNumber: saleByNumber.data,
    saleByNumberError: saleByNumber.error?.message ?? null,
    saleByDesc: saleByDesc.data,
    saleByDescError: saleByDesc.error?.message ?? null,
    wallet: wallet.data,
    walletError: wallet.error?.message ?? null,
  };
  fs.writeFileSync(path.join(OUT, "ORDER_LEDGER_PROBE.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
