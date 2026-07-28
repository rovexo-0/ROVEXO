/**
 * BLOOD V-B helper — discover release-eligible unused demo orders (SELECT only).
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { decideRelease } from "@/lib/commerce-engine/release-policy";

const BANNED = new Set(["319ca2fc-ac24-42cb-884e-ae3c3c7e2d34"]);
const BUYER = "demo.buyer@rovexo.co.uk";
const SELLER = "demo.seller@rovexo.co.uk";

function loadEnvLocal() {
  for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

async function main() {
  loadEnvLocal();
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data: users } = await c.auth.admin.listUsers({ page: 1, perPage: 200 });
  const buyerId = users?.users.find((u) => u.email === BUYER)?.id;
  const sellerId = users?.users.find((u) => u.email === SELLER)?.id;
  if (!buyerId || !sellerId) throw new Error("demo users missing");

  const { data: sales } = await c
    .from("wallet_transactions")
    .select("order_number, amount, description, status, created_at")
    .eq("user_id", sellerId)
    .eq("type", "sale")
    .eq("status", "pending")
    .is("stripe_transfer_id", null)
    .order("created_at", { ascending: false })
    .limit(30);

  const rows = [];
  for (const s of sales ?? []) {
    if (!s.order_number) continue;
    const { data: o } = await c
      .from("orders")
      .select("id, status, buyer_id, seller_id, delivered_at, order_number, item_price")
      .eq("order_number", s.order_number)
      .maybeSingle();
    if (!o) {
      rows.push({ order_number: s.order_number, orphan: true });
      continue;
    }
    const decision = decideRelease({
      status: o.status,
      deliveredAt: o.delivered_at,
      hasRefund: false,
      hasOpenClaim: false,
      requireTimer: false,
    });
    rows.push({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      amount: s.amount,
      banned: BANNED.has(o.id),
      demoPair: o.buyer_id === buyerId && o.seller_id === sellerId,
      decision,
      eligible: !BANNED.has(o.id) && o.buyer_id === buyerId && o.seller_id === sellerId && decision === "released",
    });
  }
  fs.mkdirSync("test-results/blood-v-b", { recursive: true });
  fs.writeFileSync("test-results/blood-v-b/DISCOVER.json", JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows, null, 2));
}
main();
