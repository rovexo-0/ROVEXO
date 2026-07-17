import { test, expect, type Page } from "@playwright/test";
import { createAdminClient } from "../lib/supabase/admin";
import { signInWithSessionCookies } from "./helpers/auth";
import { assertE2eUserDeletable } from "./helpers/full-demo-safety";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types/database";

const PRODUCTION_BASE_URL = process.env.PLAYWRIGHT_PRODUCTION_URL ?? "https://www.rovexo.co.uk";

type TempUser = { id: string; email: string; password: string };

test.describe.serial("production refund certification", () => {
  let admin: SupabaseClient<Database>;
  let buyer: TempUser | null = null;
  let seller: TempUser | null = null;
  let orderId: string | null = null;
  let orderNumber: string | null = null;

  async function createTempUser(role: "buyer" | "seller"): Promise<TempUser> {
    const idSeed = `${role}-${Date.now().toString(36).slice(-6)}`;
    const email = `support+e2e-refund-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_refund_${idSeed}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: `E2E Refund ${role}`, role },
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? "no user"}`);

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        username,
        full_name: `E2E Refund ${role}`,
        role,
        verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );

    if (role === "seller") {
      await admin.from("seller_profiles").upsert({ id: data.user.id }, { onConflict: "id" });
    }

    return { id: data.user.id, email, password };
  }

  async function cleanupUser(userId: string, email?: string) {
    try {
      await assertE2eUserDeletable(admin, userId);
      const { data: orders } = await admin
        .from("orders")
        .select("id")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      for (const order of orders ?? []) {
        await admin.from("order_items").delete().eq("order_id", order.id);
        await admin.from("orders").delete().eq("id", order.id);
      }
      const { data: products } = await admin.from("products").select("id").eq("seller_id", userId);
      for (const pid of (products ?? []).map((p) => p.id).filter(Boolean)) {
        await admin.from("product_images").delete().eq("product_id", pid);
        await admin.from("products").delete().eq("id", pid);
      }
      if (email) await admin.from("email_outbox").delete().eq("recipient_email", email);
      await admin.from("notifications").delete().eq("user_id", userId);
      await admin.from("seller_profiles").delete().eq("id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // best-effort
    }
  }

  async function signIn(page: Page, user: TempUser) {
    await signInWithSessionCookies(page, {
      email: user.email,
      password: user.password,
      baseURL: PRODUCTION_BASE_URL,
    });
  }

  test.beforeAll(async () => {
    const hasServiceKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
    );
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !hasServiceKey,
      "Requires Supabase credentials",
    );

    admin = createAdminClient();
    buyer = await createTempUser("buyer");
    seller = await createTempUser("seller");

    const slug = `e2e-refund-ui-${Date.now().toString(36)}`;
    const title = `E2E Refund UI ${Date.now()}`;
    const { data: product, error: productError } = await admin
      .from("products")
      .insert({
        seller_id: seller.id,
        slug,
        title,
        description: "Production refund UI certification listing.",
        price: 12.99,
        condition: "new",
        stock: 1,
        status: "published",
        moderation_status: "approved",
        shipping_price: 0,
      })
      .select("id, title, price")
      .single();

    if (productError || !product) throw new Error(productError?.message ?? "product create failed");

    await admin.from("product_images").insert({
      product_id: product.id,
      url: "/placeholder-product.svg",
      is_primary: true,
      sort_order: 0,
    });

    const now = new Date().toISOString();
    orderNumber = `RVX-E2E-${Date.now().toString(36).toUpperCase()}`;
    const refundId = `dev-refund-e2e-${Date.now()}`;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        buyer_id: buyer.id,
        seller_id: seller.id,
        status: "cancelled",
        item_price: 12.99,
        platform_fee: 0.71,
        delivery_fee: 0,
        total: 13.7,
        seller_payout: 12.99,
        paid_at: now,
        cancelled_at: now,
        cancellation_reason: "Buyer Cancelled",
        stripe_refund_id: refundId,
        refunded_amount: 13.7,
        refunded_at: now,
        refund_status: "completed",
        refund_reference: "RF-E2EUI01",
        refund_created_at: now,
        refund_completed_at: now,
        refund_payment_method: "Original payment method",
        refund_last_updated: now,
        delivery_carrier: "Royal Mail",
        shipping_method: "delivery_available",
      })
      .select("id")
      .single();

    if (orderError || !order) throw new Error(orderError?.message ?? "order create failed");
    orderId = order.id;

    await admin.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      title: product.title,
      quantity: 1,
      unit_price: 12.99,
      line_total: 12.99,
    });
  });

  test.afterAll(async () => {
    if (buyer) await cleanupUser(buyer.id, buyer.email);
    if (seller) await cleanupUser(seller.id);
  });

  test("migration columns exist on production database", async () => {
    const { error } = await admin
      .from("orders")
      .select(
        "refund_status, refund_reference, refund_created_at, refund_completed_at, refund_failure_reason, refund_payment_method, refund_estimated_arrival, refund_last_updated",
      )
      .limit(1);
    expect(error).toBeNull();
  });

  test("refund card and order list render on production", async ({ page }) => {
    test.skip(!buyer || !orderId || !orderNumber, "Test data not ready");

    await signIn(page, buyer);

    await page.goto(`${PRODUCTION_BASE_URL}/orders/${orderId}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect(page.getByRole("heading", { name: "Refund" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Status", { exact: true })).toBeVisible();
    await expect(page.getByText("🟢 Refunded")).toBeVisible();
    await expect(page.getByText("Refund", { exact: true }).nth(1)).toBeVisible();
    await expect(page.getByText(/£13\.70/).first()).toBeVisible();
    await expect(
      page.getByText(/Refunds are usually returned within 3–5 business days/i),
    ).toHaveCount(0);
    await expect(page.getByText(/RF-/)).toHaveCount(0);
    await expect(page.getByText(/Payment method/i)).toHaveCount(0);
    await expect(page.getByText(/Last updated/i)).toHaveCount(0);
    await expect(page.getByText("Refund Completed")).toBeVisible();

    await page.goto(`${PRODUCTION_BASE_URL}/orders`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(orderNumber!)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Refunded")).toBeVisible();
  });
});
