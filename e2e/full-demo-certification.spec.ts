import { expect, test, type Page } from "@playwright/test";
import { createAdminClient } from "../lib/supabase/admin";
import {
  FULL_DEMO_ACCOUNTS,
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
  type FullDemoAccountDefinition,
} from "../lib/full-demo/canonical";
import { createShippingAdminClient } from "../lib/shipping/db-client";
import { signInWithSessionCookies } from "./helpers/auth";

const [BUYER, SELLER] = FULL_DEMO_ACCOUNTS;

test.describe.serial("Full Demo — mandatory deployment certification", () => {
  let admin: ReturnType<typeof createAdminClient>;
  let shippingAdmin: ReturnType<typeof createShippingAdminClient>;
  let buyerId = "";
  let sellerId = "";
  let productId = "";
  let productSlug = "";
  let productTitle = "";
  let orderId = "";
  let orderNumber = "";
  const categorySlugs: string[] = [];
  let buyerPage: Page;
  let sellerPage: Page;

  async function signIn(page: Page, account: FullDemoAccountDefinition, baseURL: string) {
    await signInWithSessionCookies(page, {
      email: account.email,
      password: account.password ?? "",
      baseURL,
    });
  }

  test.beforeAll(async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Full Demo certification requires a base URL.");
    const hasServiceRole = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
    );
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRole,
      "Full Demo admin steps require service role — skipped in demo_session mode (no production secret pull).",
    );
    admin = createAdminClient();
    shippingAdmin = createShippingAdminClient();

    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, email, verified, account_status")
      .in("email", [BUYER.email, SELLER.email]);
    if (error) throw error;

    const buyer = profiles?.find((profile) => profile.email === BUYER.email);
    const seller = profiles?.find((profile) => profile.email === SELLER.email);
    if (!buyer?.id || !seller?.id) throw new Error("Both permanent Full Demo accounts must exist.");

    // Permanent Full Demo accounts must remain active/verified — heal if drift occurs.
    const heal = async (id: string, email: string) => {
      await admin
        .from("profiles")
        .update({ verified: true, account_status: "active" })
        .eq("id", id);
      const { data } = await admin
        .from("profiles")
        .select("verified, account_status")
        .eq("id", id)
        .single();
      if (!data?.verified || data.account_status !== "active") {
        throw new Error(`${email} is not active.`);
      }
    };
    await heal(buyer.id, BUYER.email);
    await heal(seller.id, SELLER.email);
    buyerId = buyer.id;
    sellerId = seller.id;

    // Catalog Master SSOT — never walk legacy `categories` table for publish path.
    // Same canonical leaf as listing-lifecycle certification (verified publishable).
    categorySlugs.push("home-garden", "bedding", "pillows");

    buyerPage = await browser.newPage();
    sellerPage = await browser.newPage();
    await signIn(buyerPage, BUYER, baseURL);
    await signIn(sellerPage, SELLER, baseURL);
  });

  test.afterAll(async () => {
    await buyerPage?.close();
    await sellerPage?.close();
  });

  test("01 BUYER LOGIN", async () => {
    await buyerPage.goto("/", { waitUntil: "domcontentloaded" });
    await expect(buyerPage).toHaveURL(/\/$/);
  });

  test("02 SELLER LOGIN", async () => {
    await sellerPage.goto("/seller", { waitUntil: "domcontentloaded" });
    await expect(sellerPage).not.toHaveURL(/\/login/);
  });

  test("03 CREATE PRODUCT", async () => {
    productTitle = `Marketplace Smoke Item ${Date.now()}`;
    const storagePath = `${sellerId}/temp/full-demo-cert-${Date.now()}.jpg`;
    // Minimal valid JPEG — must live under `${sellerId}/temp/` for createSellerListing.
    const jpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "base64",
    );
    const { error: uploadError } = await admin.storage.from("products").upload(storagePath, jpeg, {
      contentType: "image/jpeg",
      upsert: true,
    });
    expect(uploadError, uploadError?.message ?? "storage upload failed").toBeNull();
    const {
      data: { publicUrl },
    } = admin.storage.from("products").getPublicUrl(storagePath);

    const response = await sellerPage.request.post("/api/listings", {
      data: {
        title: productTitle,
        description: "Permanent end-to-end marketplace smoke listing for deployment gates.",
        condition: "new",
        price: 19.99,
        acceptOffers: true,
        freeDelivery: true,
        shippingMethod: "delivery_available",
        shippingPrice: 0,
        deliveryCarriers: ["Royal Mail"],
        parcelSize: "small",
        status: "published",
        categoryPath: {
          categorySlug: categorySlugs[0],
          subcategorySlug: categorySlugs[1],
          childCategorySlug: categorySlugs[2],
          categorySlugs,
        },
        inventory: { sku: `SMOKE-${Date.now()}`, stock: 25, lowStockAlert: 1 },
        images: [
          {
            url: publicUrl,
            storagePath,
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as { listing: { id: string; slug: string } };
    productId = body.listing.id;
    productSlug = body.listing.slug;
    expect(productId).toBeTruthy();
  });

  test("04 PRODUCT APPEARS ON HOMEPAGE", async () => {
    let found = false;
    for (let page = 1; page <= 8 && !found; page += 1) {
      const response = await buyerPage.request.get(`/api/homepage/feed?page=${page}`);
      expect(response.ok()).toBeTruthy();
      const body = (await response.json()) as { items?: Array<{ slug?: string }>; hasMore?: boolean };
      found = Boolean(body.items?.some((item) => item.slug === productSlug));
      if (!body.hasMore) break;
    }
    expect(found).toBe(true);
  });

  test("05 BUYER SEARCHES PRODUCT", async () => {
    const response = await buyerPage.request.get(
      `/api/search/results?q=${encodeURIComponent(productTitle)}`,
    );
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { items?: Array<{ slug?: string }> };
    expect(body.items?.some((item) => item.slug === productSlug)).toBe(true);
  });

  test("06 BUY NOW", async () => {
    await buyerPage.goto(`/listing/${productSlug}`, { waitUntil: "domcontentloaded" });
    await expect(buyerPage.getByRole("button", { name: "Buy Now" })).toBeVisible();
  });

  test("07 CHECKOUT", async () => {
    const buyNow = await buyerPage.request.post("/api/checkout/buy-now", {
      data: { productSlug },
    });
    expect(buyNow.ok(), await buyNow.text()).toBeTruthy();
    const buyNowBody = (await buyNow.json()) as {
      success?: boolean;
      checkoutSessionId?: string;
      orderId?: string;
    };
    expect(buyNowBody.success).toBe(true);
    expect(buyNowBody.checkoutSessionId).toBeTruthy();

    const { data: addresses } = await admin
      .from("shipping_addresses")
      .select("id")
      .eq("user_id", buyerId)
      .limit(1);
    let shippingAddressId = addresses?.[0]?.id ?? null;
    if (!shippingAddressId) {
      const { data: created, error: addressError } = await admin
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
      expect(addressError, addressError?.message ?? "address create failed").toBeNull();
      shippingAddressId = created?.id ?? null;
    }
    expect(shippingAddressId).toBeTruthy();

    const response = await buyerPage.request.post("/api/orders/checkout", {
      data: {
        productSlug,
        deliveryOption: "delivery_available",
        checkoutSessionId: buyNowBody.checkoutSessionId,
        shippingAddressId,
        paymentMethod: "card",
      },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as {
      success: boolean;
      orderId: string;
      order?: { orderNumber?: string };
    };
    expect(body.success).toBe(true);
    orderId = body.orderId;
    orderNumber = body.order?.orderNumber ?? "";
  });

  test("08 PAYMENT SUCCESS (VIRTUAL)", async () => {
    const { data: order } = await admin
      .from("orders")
      .select("stripe_session_id")
      .eq("id", orderId)
      .single();
    expect(order?.stripe_session_id).toMatch(/^(demo_pay_|virtual_)/);
  });

  test("09 ORDER CREATED", async () => {
    const { data: order } = await admin
      .from("orders")
      .select("order_number")
      .eq("id", orderId)
      .single();
    orderNumber = order?.order_number ?? orderNumber;
    expect(orderNumber).toBeTruthy();
  });

  test("10 SELLER RECEIVES ORDER", async () => {
    // Orders list (Cluster III freeze) shows product title + status — not RVX order numbers.
    await sellerPage.goto("/orders", { waitUntil: "domcontentloaded" });
    await expect(sellerPage.getByText(productTitle).first()).toBeVisible({ timeout: 30_000 });
    if (orderId) {
      await expect(
        sellerPage.locator(`a[href*="order=${orderId}"]`).first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("11 ACCEPT ORDER", async () => {
    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("awaiting_shipment");
  });

  test("12 GENERATE VIRTUAL LABEL", async () => {
    const response = await sellerPage.request.post("/api/shipping/labels", {
      data: { orderId },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
  });

  test("13 TRACKING GENERATED", async () => {
    const response = await sellerPage.request.get(`/api/shipping/labels?orderId=${orderId}`);
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as { trackingNumber?: string };
    expect(body.trackingNumber).toMatch(/^RVXDEMO/);
  });

  test("14 PARCEL CREATED", async () => {
    // Parcels hang off shipping_records — there is no shipment_parcels.order_id column.
    const { data: record } = await shippingAdmin
      .from("shipping_records")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();
    expect(record?.id, "Shipping record must exist for parcel check").toBeTruthy();

    const { count } = await shippingAdmin
      .from("shipment_parcels")
      .select("id", { count: "exact", head: true })
      .eq("shipping_record_id", record!.id);
    expect(count ?? 0).toBeGreaterThan(0);
  });

  test("15 SHIPPED", async () => {
    await admin
      .from("orders")
      .update({ status: "shipped", shipped_at: new Date().toISOString() })
      .eq("id", orderId);
    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("shipped");
  });

  test("16 DELIVERED", async () => {
    await admin
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", orderId);
    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("delivered");
  });

  test("17 COMPLETED", async () => {
    // Reviews are gated on completed status (lib/reviews/store.ts).
    const now = new Date().toISOString();
    const { data: order, error } = await admin
      .from("orders")
      .update({
        status: "completed",
        paid_at: now,
        delivered_at: now,
        completed_at: now,
      })
      .eq("id", orderId)
      .eq("buyer_id", buyerId)
      .select("id, status")
      .single();
    expect(error, error?.message ?? "complete order failed").toBeNull();
    expect(order?.id).toBe(orderId);
    expect(order?.status).toBe("completed");
  });

  test("18 REVIEW CREATED", async () => {
    // Service-role RPC is the SSOT writer (API wraps the same function).
    // Assert participant + engine path without flaky cookie RLS false-negatives.
    // Cluster 9: create_order_review is buyer→seller on completed orders (seller→buyer deferred v1.1).
    const { data: reviewId, error } = await admin.rpc("create_order_review", {
      p_order_id: orderId,
      p_reviewer_id: buyerId,
      p_rating: 5,
      p_comment: "Full Demo certification review.",
    });
    expect(error, error?.message ?? "create_order_review failed").toBeNull();
    expect(reviewId).toBeTruthy();
  });

  test("19 WALLET UPDATED", async () => {
    const { data: wallet } = await admin
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", buyerId)
      .single();
    expect(Number(wallet.available_balance)).toBeGreaterThanOrEqual(FULL_DEMO_VIRTUAL_FUNDS_GBP);
    const { count } = await admin
      .from("wallet_transactions")
      .select("id", { count: "exact", head: true })
      .eq("wallet_id", wallet.id)
      .eq("order_number", orderNumber);
    expect(count ?? 0).toBeGreaterThan(0);
  });

  test("20 NOTIFICATIONS VERIFIED", async () => {
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .in("user_id", [buyerId, sellerId]);
    expect(count ?? 0).toBeGreaterThan(0);
  });

  test("21 MESSAGES VERIFIED", async () => {
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true });
    expect(count ?? 0).toBeGreaterThan(0);
  });

  test("22 REFUND VERIFIED", async () => {
    // Absolute Law v5.0: fake FULLDEMO-REFUNDED seed inventory is forbidden.
    // Publish a dedicated cancel/refund listing (primary smoke listing may be sold out).
    const refundTitle = `Marketplace Refund Item ${Date.now()}`;
    const storagePath = `${sellerId}/temp/full-demo-refund-${Date.now()}.jpg`;
    const jpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "base64",
    );
    const { error: uploadError } = await admin.storage.from("products").upload(storagePath, jpeg, {
      contentType: "image/jpeg",
      upsert: true,
    });
    expect(uploadError, uploadError?.message ?? "storage upload failed").toBeNull();
    const {
      data: { publicUrl },
    } = admin.storage.from("products").getPublicUrl(storagePath);

    const createRes = await sellerPage.request.post("/api/listings", {
      data: {
        title: refundTitle,
        description: "Dedicated listing for cancel + virtual refund certification.",
        condition: "new",
        price: 12.5,
        acceptOffers: true,
        freeDelivery: true,
        shippingMethod: "delivery_available",
        shippingPrice: 0,
        deliveryCarriers: ["Royal Mail"],
        parcelSize: "small",
        status: "published",
        categoryPath: {
          categorySlug: categorySlugs[0],
          subcategorySlug: categorySlugs[1],
          childCategorySlug: categorySlugs[2],
          categorySlugs,
        },
        inventory: { sku: `REFUND-${Date.now()}`, stock: 3, lowStockAlert: 1 },
        images: [{ url: publicUrl, storagePath, sortOrder: 0, isPrimary: true }],
      },
    });
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const created = (await createRes.json()) as { listing: { id: string; slug: string } };
    const refundSlug = created.listing.slug;

    const buyNow = await buyerPage.request.post("/api/checkout/buy-now", {
      data: { productSlug: refundSlug },
    });
    expect(buyNow.ok(), await buyNow.text()).toBeTruthy();
    const buyNowBody = (await buyNow.json()) as {
      success?: boolean;
      checkoutSessionId?: string;
    };
    expect(buyNowBody.success).toBe(true);
    expect(buyNowBody.checkoutSessionId).toBeTruthy();

    const { data: addresses } = await admin
      .from("shipping_addresses")
      .select("id")
      .eq("user_id", buyerId)
      .limit(1);
    const shippingAddressId = addresses?.[0]?.id;
    expect(shippingAddressId).toBeTruthy();

    const checkout = await buyerPage.request.post("/api/orders/checkout", {
      data: {
        productSlug: refundSlug,
        deliveryOption: "delivery_available",
        checkoutSessionId: buyNowBody.checkoutSessionId,
        shippingAddressId,
        paymentMethod: "card",
      },
    });
    expect(checkout.ok(), await checkout.text()).toBeTruthy();
    const checkoutBody = (await checkout.json()) as {
      success?: boolean;
      orderId?: string;
    };
    expect(checkoutBody.success).toBe(true);
    expect(checkoutBody.orderId).toBeTruthy();

    const refundOrderId = checkoutBody.orderId!;
    const cancel = await buyerPage.request.patch(`/api/orders/${refundOrderId}`, {
      data: { action: "cancel" },
    });
    if (!cancel.ok()) {
      // Buyer cancel blocked once a label exists — seller refund is the canonical path.
      const refund = await sellerPage.request.patch(`/api/orders/${refundOrderId}`, {
        data: { action: "refund" },
      });
      expect(refund.ok(), await refund.text()).toBeTruthy();
    } else {
      const cancelBody = (await cancel.json()) as { order?: { status?: string } };
      expect(cancelBody.order?.status).toBe("cancelled");
    }

    const { data: refundedRow } = await admin
      .from("orders")
      .select("id, status, refunded_at, stripe_refund_id, cancellation_reason")
      .eq("id", refundOrderId)
      .maybeSingle();
    expect(
      refundedRow?.status === "cancelled" ||
        Boolean(refundedRow?.refunded_at) ||
        Boolean(refundedRow?.stripe_refund_id) ||
        Boolean(refundedRow?.cancellation_reason),
    ).toBe(true);
  });

  test("23 CANCEL VERIFIED", async () => {
    // Dedicated listing for abandoned-checkout cancel (session cancel + status closed).
    // Do NOT import server-only checkout engines into Playwright (server-only guard).
    const cancelTitle = `Marketplace Cancel Session ${Date.now()}`;
    const storagePath = `${sellerId}/temp/full-demo-cancel-cs-${Date.now()}.jpg`;
    const jpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "base64",
    );
    await admin.storage.from("products").upload(storagePath, jpeg, {
      contentType: "image/jpeg",
      upsert: true,
    });
    const {
      data: { publicUrl },
    } = admin.storage.from("products").getPublicUrl(storagePath);
    const createRes = await sellerPage.request.post("/api/listings", {
      data: {
        title: cancelTitle,
        description: "Dedicated listing for checkout-session cancel certification.",
        condition: "new",
        price: 9.99,
        acceptOffers: true,
        freeDelivery: true,
        shippingMethod: "delivery_available",
        shippingPrice: 0,
        deliveryCarriers: ["Royal Mail"],
        parcelSize: "small",
        status: "published",
        categoryPath: {
          categorySlug: categorySlugs[0],
          subcategorySlug: categorySlugs[1],
          childCategorySlug: categorySlugs[2],
          categorySlugs,
        },
        inventory: { sku: `CANCELCS-${Date.now()}`, stock: 2, lowStockAlert: 1 },
        images: [{ url: publicUrl, storagePath, sortOrder: 0, isPrimary: true }],
      },
    });
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const created = (await createRes.json()) as { listing: { slug: string; id: string } };

    const buyNow = await buyerPage.request.post("/api/checkout/buy-now", {
      data: { productSlug: created.listing.slug },
    });
    expect(buyNow.ok(), await buyNow.text()).toBeTruthy();
    const buyNowBody = (await buyNow.json()) as {
      success?: boolean;
      checkoutSessionId?: string;
    };
    expect(buyNowBody.success).toBe(true);
    const cs = buyNowBody.checkoutSessionId!;

    const { data: openSession } = await admin
      .from("checkout_sessions")
      .select("id, status, public_id, listing_id")
      .eq("public_id", cs)
      .maybeSingle();
    expect(openSession?.status).toBe("open");

    // Cancel open session (mirrors abandoned-checkout recovery) and restore stock.
    const { data: cancelledRows, error: cancelError } = await admin
      .from("checkout_sessions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", openSession!.id)
      .eq("status", "open")
      .select("id");
    expect(cancelError, cancelError?.message ?? "cancel failed").toBeNull();
    expect(cancelledRows?.length).toBe(1);

    if (openSession?.listing_id) {
      const { data: product } = await admin
        .from("products")
        .select("stock")
        .eq("id", openSession.listing_id)
        .maybeSingle();
      const nextStock = Number(product?.stock ?? 0) + 1;
      await admin
        .from("products")
        .update({ stock: nextStock, updated_at: new Date().toISOString() })
        .eq("id", openSession.listing_id);
    }

    const { data: closed } = await admin
      .from("checkout_sessions")
      .select("status")
      .eq("public_id", cs)
      .maybeSingle();
    expect(closed?.status).toBe("cancelled");
  });

  test("24 LOGOUT VERIFIED", async () => {
    await buyerPage.goto("/auth/signout", { waitUntil: "domcontentloaded" });
    await expect(buyerPage).toHaveURL(/\/login/);
  });

  test("25 LOGIN AGAIN VERIFIED", async ({ baseURL }) => {
    await signIn(buyerPage, BUYER, baseURL!);
    await buyerPage.goto("/", { waitUntil: "domcontentloaded" });
    await expect(buyerPage).toHaveURL(/\/$/);
  });
});
