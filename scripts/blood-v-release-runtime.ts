/**
 * BLOOD V — Execute existing releaseOrderNow for Blood IV completed order.
 * Does not modify Checkout/Payment/Order/Transaction/Shipping engines.
 * Closes the financial gap: order completed without escrow release.
 */
import Module from "node:module";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Allow importing server-only modules from this Node proof runner.
const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load;
(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function (
  request: string,
  parent: unknown,
  isMain: boolean,
) {
  if (request === "server-only") return {};
  return originalLoad(request, parent, isMain);
};

const OUT = path.join(process.cwd(), "test-results", "blood-v");
const ORDER_ID = process.env.BLOOD_V_ORDER_ID || "319ca2fc-ac24-42cb-884e-ae3c3c7e2d34";
const ORDER_NUMBER = "RVX7512FF91";
const SELLER_ID = "8346d7b6-19e9-4e93-a60a-fb93452a19ad";
const ITEM = 24.99;

fs.mkdirSync(OUT, { recursive: true });

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
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

function near(a: number, b: number, eps = 0.02) {
  return Math.abs(a - b) <= eps;
}

function sb() {
  loadEnvLocal();
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function snap(client: ReturnType<typeof sb>) {
  const { data: sale } = await client
    .from("wallet_transactions")
    .select("id, type, status, amount, fee_amount, description, order_number, stripe_transfer_id, created_at")
    .eq("user_id", SELLER_ID)
    .eq("order_number", ORDER_NUMBER)
    .eq("type", "sale")
    .maybeSingle();
  const { data: wallet } = await client
    .from("wallets")
    .select("id, pending_balance, available_balance")
    .eq("user_id", SELLER_ID)
    .maybeSingle();
  const { data: escrow } = await client
    .from("escrow_events")
    .select("id, event_type, from_state, to_state, reason, amount, created_at")
    .eq("order_id", ORDER_ID)
    .order("created_at", { ascending: true });
  return { sale, wallet, escrow: escrow ?? [] };
}

async function main() {
  loadEnvLocal();
  // Virtual demo wallet for Full Demo certification accounts.
  process.env.ROVEXO_FULL_DEMO = process.env.ROVEXO_FULL_DEMO || "1";
  process.env.NEXT_PUBLIC_ROVEXO_FULL_DEMO = process.env.NEXT_PUBLIC_ROVEXO_FULL_DEMO || "1";

  const client = sb();
  const before = await snap(client);

  const { releaseOrderNow } = await import("@/lib/commerce-engine/settlement");
  const first = await releaseOrderNow(ORDER_ID);
  const after = await snap(client);
  const second = await releaseOrderNow(ORDER_ID);
  const afterIdem = await snap(client);

  const releaseEvents = after.escrow.filter(
    (e) =>
      e.event_type === "moved_to_available" ||
      e.event_type === "hold_released" ||
      e.to_state === "available" ||
      e.to_state === "released",
  );
  const moved = after.escrow.filter((e) => e.event_type === "moved_to_available");
  const heldReleased = after.escrow.filter((e) => e.event_type === "hold_released");

  const pendingDelta =
    Number(before.wallet?.pending_balance ?? 0) - Number(after.wallet?.pending_balance ?? 0);

  const gates: Record<string, "PASS" | "FAIL" | "WARN"> = {
    cp1_hold_before_release:
      before.escrow.some((e) => e.event_type === "hold_created") && before.sale?.status === "pending"
        ? "PASS"
        : "FAIL",
    cp1_seller_pending_held_item:
      before.sale && near(Number(before.sale.amount), ITEM) && Number(before.sale.fee_amount) === 0
        ? "PASS"
        : "FAIL",
    cp2_release_now_success: first.released && first.reason === "released" ? "PASS" : "FAIL",
    cp2_single_moved_to_available: moved.length === 1 ? "PASS" : "FAIL",
    cp2_single_hold_released: heldReleased.length === 1 ? "PASS" : "FAIL",
    cp2_idempotent_second_call:
      !second.released && second.reason === "no_pending_sale" ? "PASS" : "FAIL",
    cp2_no_duplicate_release_events:
      afterIdem.escrow.filter((e) => e.event_type === "hold_released").length === 1 ? "PASS" : "FAIL",
    cp4_fee_excluded: after.sale && Number(after.sale.fee_amount) === 0 ? "PASS" : "FAIL",
    cp4_amount_full_item: after.sale && near(Number(after.sale.amount), ITEM) ? "PASS" : "FAIL",
    cp4_sale_completed: after.sale?.status === "completed" ? "PASS" : "FAIL",
    cp4_pending_reduced_by_item: near(pendingDelta, ITEM) ? "PASS" : "FAIL",
    cp4_escrow_available_then_released:
      releaseEvents.some((e) => e.to_state === "available") &&
      releaseEvents.some((e) => e.to_state === "released")
        ? "PASS"
        : "FAIL",
    cp6_transfer_ref: Boolean(after.sale?.stripe_transfer_id) ? "PASS" : "FAIL",
    cp6_single_sale_row: after.sale ? "PASS" : "FAIL",
    cp9_stable_after_idempotent_reread:
      after.sale?.id === afterIdem.sale?.id &&
      after.sale?.stripe_transfer_id === afterIdem.sale?.stripe_transfer_id
        ? "PASS"
        : "FAIL",
  };

  const failed = Object.values(gates).filter((g) => g === "FAIL").length;
  const report = {
    law: "BLOOD V",
    step: "RELEASE_RUNTIME",
    orderId: ORDER_ID,
    orderNumber: ORDER_NUMBER,
    first,
    second,
    before,
    after,
    afterIdem,
    pendingDelta,
    gates,
    failed,
    verdict: failed === 0 ? "PASS" : "FAIL",
  };
  fs.writeFileSync(path.join(OUT, "RELEASE_RUNTIME.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
