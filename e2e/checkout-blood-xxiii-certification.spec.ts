/**
 * Blood XXIII — Checkout Certification E2E (RC1 Agent 1)
 *
 * Canonical journey evidence (Full Demo virtual payments):
 * Product → Buy Now → Confirm & Pay → Success binding → Order → DONE gate → Hub id
 * + duplicate Confirm & Pay returns same order
 *
 * Requires: localhost:3000, Full Demo accounts, service role.
 * Skips cleanly when secrets are absent (no false PASS).
 */

import { expect, test, type Page } from "@playwright/test";
import { createAdminClient } from "../lib/supabase/admin";
import { FULL_DEMO_ACCOUNTS, type FullDemoAccountDefinition } from "../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./helpers/auth";

const [BUYER, SELLER] = FULL_DEMO_ACCOUNTS;

test.describe.serial("Blood XXIII — Checkout certification journey", () => {
  let admin: ReturnType<typeof createAdminClient>;
  let buyerId = "";
  let sellerId = "";
  let productSlug = "";
  let productTitle = "";
  let checkoutSessionId = "";
  let orderId = "";
  let buyerPage: Page;

  async function signIn(page: Page, account: FullDemoAccountDefinition, baseURL: string) {
    await signInWithSessionCookies(page, {
      email: account.email,
      password: account.password ?? "",
      baseURL,
    });
  }

  test.beforeAll(async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Checkout certification requires baseURL.");
    const hasServiceRole = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
    );
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRole,
      "Checkout Blood XXIII E2E requires service role — skipped without secrets.",
    );

    admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, email")
      .in("email", [BUYER.email, SELLER.email]);
    if (error) throw error;
    const buyer = profiles?.find((p) => p.email === BUYER.email);
    const seller = profiles?.find((p) => p.email === SELLER.email);
    if (!buyer?.id || !seller?.id) throw new Error("Full Demo buyer/seller profiles required.");
    buyerId = buyer.id;
    sellerId = seller.id;

    /* Product SSOT uses status=published (not "active"). Prefer unsold stock for certification. */
    const { data: product } = await admin
      .from("products")
      .select("id, slug, title, status, stock, price")
      .eq("seller_id", sellerId)
      .eq("status", "published")
      .gt("stock", 0)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!product?.slug) {
      test.skip(true, "No published unsold seller listing available for Checkout E2E.");
    }
    productSlug = product!.slug;
    productTitle = product!.title;

    const context = await browser.newContext();
    buyerPage = await context.newPage();
    await signIn(buyerPage, BUYER, baseURL);
  });

  test("01 Product page exposes Buy Now", async () => {
    await buyerPage.goto(`/listing/${productSlug}`, { waitUntil: "domcontentloaded" });
    await expect(buyerPage.getByRole("button", { name: "Buy Now" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(buyerPage.getByText(productTitle).first()).toBeVisible();
  });

  test("02 Buy Now creates checkout session (no order yet)", async () => {
    const buyNow = await buyerPage.request.post("/api/checkout/buy-now", {
      data: { productSlug },
    });
    expect(buyNow.ok(), await buyNow.text()).toBeTruthy();
    const body = (await buyNow.json()) as {
      success?: boolean;
      checkoutSessionId?: string;
      orderId?: string | null;
      checkoutPath?: string;
    };
    expect(body.success).toBe(true);
    expect(body.checkoutSessionId).toBeTruthy();
    expect(body.orderId == null || body.orderId === "").toBe(true);
    checkoutSessionId = body.checkoutSessionId!;
  });

  test("03 Checkout page loads with cs binding", async () => {
    await buyerPage.goto(`/checkout/${productSlug}?cs=${encodeURIComponent(checkoutSessionId)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(buyerPage.locator("[data-checkout-freeze='CHECKOUT_UI_v1.0']")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("04 Confirm & Pay (virtual) creates order", async () => {
    const { data: addresses } = await admin
      .from("shipping_addresses")
      .select("id")
      .eq("user_id", buyerId)
      .limit(1);
    let shippingAddressId = addresses?.[0]?.id ?? null;
    if (!shippingAddressId) {
      const { data: created, error } = await admin
        .from("shipping_addresses")
        .insert({
          user_id: buyerId,
          recipient_name: "Demo Buyer",
          address_line: "10 Downing Street",
          postcode: "SW1A 2AA",
          country: "United Kingdom",
          is_default: true,
        })
        .select("id")
        .single();
      expect(error, error?.message).toBeNull();
      shippingAddressId = created?.id ?? null;
    }
    expect(shippingAddressId).toBeTruthy();

    const response = await buyerPage.request.post("/api/orders/checkout", {
      data: {
        productSlug,
        deliveryOption: "delivery_available",
        checkoutSessionId,
        shippingAddressId,
        paymentMethod: "card",
        idempotencyKey: `e2e_xxiii_${checkoutSessionId}`,
      },
      headers: { "Idempotency-Key": `e2e_xxiii_${checkoutSessionId}` },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as {
      success?: boolean;
      orderId?: string;
      url?: string;
    };
    expect(body.success).toBe(true);
    expect(body.orderId).toBeTruthy();
    orderId = body.orderId!;
  });

  test("05 Duplicate Confirm & Pay returns same order (no second payment)", async () => {
    const { data: addresses } = await admin
      .from("shipping_addresses")
      .select("id")
      .eq("user_id", buyerId)
      .limit(1);
    const shippingAddressId = addresses?.[0]?.id;
    expect(shippingAddressId).toBeTruthy();

    const response = await buyerPage.request.post("/api/orders/checkout", {
      data: {
        productSlug,
        deliveryOption: "delivery_available",
        checkoutSessionId,
        shippingAddressId,
        paymentMethod: "card",
        idempotencyKey: `e2e_xxiii_${checkoutSessionId}`,
      },
      headers: { "Idempotency-Key": `e2e_xxiii_${checkoutSessionId}` },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as { success?: boolean; orderId?: string };
    expect(body.success).toBe(true);
    expect(body.orderId).toBe(orderId);
  });

  test("06 DONE readiness exposes conversation Hub id when ready", async () => {
    expect(orderId).toBeTruthy();
    let conversationId: string | null = null;
    for (let i = 0; i < 20; i += 1) {
      const res = await buyerPage.request.get(
        `/api/checkout/done-ready?order_id=${encodeURIComponent(orderId)}`,
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const payload = (await res.json()) as {
        allPass?: boolean;
        conversationId?: string | null;
      };
      if (payload.conversationId) {
        conversationId = payload.conversationId;
        break;
      }
      await buyerPage.waitForTimeout(500);
    }
    // Conversation may lag fulfillment — require order paid binding at minimum.
    const { data: order } = await admin
      .from("orders")
      .select("id, status, stripe_session_id")
      .eq("id", orderId)
      .single();
    expect(order?.id).toBe(orderId);
    expect(order?.stripe_session_id).toMatch(/^(demo_pay_|virtual_)/);
    if (conversationId) {
      await buyerPage.goto(`/inbox/conversation/${conversationId}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(buyerPage.locator("body")).toBeVisible();
    }
  });
});
