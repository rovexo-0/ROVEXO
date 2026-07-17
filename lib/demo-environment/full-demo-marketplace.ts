/**
 * Full Demo marketplace seed — contract quotas for LIVE BUYER + LIVE SELLER.
 * Idempotent: existing FULLDEMO-* rows are counted and only missing inventory is added.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { DemoUserRecord } from "@/lib/demo-environment/users";
import { demoProductImageUrl } from "@/lib/demo-environment/config";
import {
  FULL_DEMO_BUYER_QUOTAS,
  FULL_DEMO_PARCEL_SPECS,
  FULL_DEMO_SELLER_QUOTAS,
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
  generateDemoDeliveryDate,
  generateDemoTrackingNumber,
} from "@/lib/full-demo/canonical";
import { createNotification } from "@/lib/notifications/create";
import { createShippingAdminClient } from "@/lib/shipping/db-client";

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  seller_id: string;
  price: number;
};

type OrderBucket =
  | "completed"
  | "cancelled"
  | "refunded"
  | "delivered"
  | "disputed";

type OrderStatusSpec = {
  bucket: OrderBucket;
  status: Database["public"]["Enums"]["order_status"];
  paid?: boolean;
  shipped?: boolean;
  delivered?: boolean;
  refunded?: boolean;
  disputed?: boolean;
  review?: boolean;
  tracking?: boolean;
};

const BUCKET_SPECS: Record<OrderBucket, OrderStatusSpec> = {
  completed: {
    bucket: "completed",
    status: "completed",
    paid: true,
    shipped: true,
    delivered: true,
    review: true,
    tracking: true,
  },
  cancelled: {
    bucket: "cancelled",
    status: "cancelled",
  },
  refunded: {
    bucket: "refunded",
    status: "cancelled",
    paid: true,
    refunded: true,
  },
  delivered: {
    bucket: "delivered",
    status: "delivered",
    paid: true,
    shipped: true,
    delivered: true,
    review: true,
    tracking: true,
  },
  disputed: {
    bucket: "disputed",
    status: "issue_open",
    paid: true,
    shipped: true,
    disputed: true,
    tracking: true,
  },
};

/** Kept for contract tests — one row per certification label. */
export const FULL_DEMO_ORDER_STATUS_SPECS = [
  { certState: "Pending", status: "awaiting_payment" as const },
  { certState: "Paid", status: "awaiting_shipment" as const, paid: true },
  { certState: "Accepted", status: "awaiting_shipment" as const, paid: true },
  { certState: "Rejected", status: "cancelled" as const },
  { certState: "Packed", status: "awaiting_shipment" as const, paid: true },
  { certState: "Label Created", status: "awaiting_shipment" as const, paid: true },
  { certState: "Shipped", status: "shipped" as const, paid: true, shipped: true },
  { certState: "In Transit", status: "shipped" as const, paid: true, shipped: true },
  { certState: "Delivered", status: "delivered" as const, paid: true, shipped: true, delivered: true },
  { certState: "Completed", status: "completed" as const, paid: true, shipped: true, delivered: true },
  { certState: "Refunded", status: "cancelled" as const, paid: true, refunded: true },
  { certState: "Cancelled", status: "cancelled" as const },
  { certState: "Disputed", status: "issue_open" as const, paid: true, shipped: true, disputed: true },
  { certState: "Resolved", status: "completed" as const, paid: true, shipped: true, delivered: true },
];

async function loadSellerProducts(
  admin: SupabaseClient<Database>,
  sellerId: string,
): Promise<ProductRow[]> {
  const { data, error } = await admin
    .from("products")
    .select("id, slug, title, seller_id, price")
    .eq("seller_id", sellerId)
    .eq("status", "published")
    .like("slug", "demo-live-seller-%")
    .limit(200);

  if (error || !data?.length) {
    const fallback = await admin
      .from("products")
      .select("id, slug, title, seller_id, price")
      .eq("seller_id", sellerId)
      .eq("status", "published")
      .limit(200);
    if (!fallback.data?.length) {
      throw new Error("Full Demo seed requires LIVE SELLER published products.");
    }
    return fallback.data as ProductRow[];
  }

  return data as ProductRow[];
}

async function defaultAddressId(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("shipping_addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function countOrdersByPrefix(
  admin: SupabaseClient<Database>,
  prefix: string,
): Promise<number> {
  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .like("order_number", `${prefix}%`);
  return count ?? 0;
}

async function seedShippingForOrder(input: {
  orderId: string;
  orderNumber: string;
  index: number;
  delivered: boolean;
}): Promise<number> {
  const shipping = createShippingAdminClient();
  const parcelGroup = FULL_DEMO_PARCEL_SPECS[input.index % FULL_DEMO_PARCEL_SPECS.length]!;
  const totalParcels = parcelGroup.totalParcels;

  const { data: existingRecord } = await shipping
    .from("shipping_records")
    .select("id")
    .eq("order_id", input.orderId)
    .maybeSingle();

  const existingId =
    existingRecord && typeof existingRecord === "object" && "id" in existingRecord
      ? String((existingRecord as { id: string }).id)
      : null;

  let recordId = existingId;

  if (!recordId) {
    const tracking = generateDemoTrackingNumber(`${input.orderNumber}-R`);
    const { data: record, error } = await shipping
      .from("shipping_records")
      .insert({
        order_id: input.orderId,
        parcel_tier: "small_parcel",
        status: input.delivered ? "delivered" : "in_transit",
        carrier: "Royal Mail",
        tracking_number: tracking,
      })
      .select("id")
      .single();

    if (error || !record || typeof record !== "object" || !("id" in record)) return 0;
    recordId = String((record as { id: string }).id);

    for (const event of [
      { status: "preparing", title: "Label created", daysAgo: 3 },
      { status: "collected", title: "Collected by courier", daysAgo: 2 },
      { status: "in_transit", title: "In transit", daysAgo: 1 },
    ] as const) {
      await shipping.from("shipping_tracking_events").insert({
        shipping_record_id: recordId,
        status: event.status,
        title: event.title,
        description: `Demo courier update — ${event.title}`,
        location: "London Hub",
        occurred_at: new Date(Date.now() - event.daysAgo * 86400000).toISOString(),
        source: "carrier",
      });
    }

    if (input.delivered) {
      await shipping.from("shipping_tracking_events").insert({
        shipping_record_id: recordId,
        status: "delivered",
        title: "Delivered",
        description: "Demo delivery completed.",
        location: "Buyer address",
        occurred_at: new Date(Date.now() - 6 * 3600000).toISOString(),
        source: "carrier",
      });
    }
  }

  let parcelsCreated = 0;
  for (let n = 1; n <= totalParcels; n += 1) {
    const { data: existingParcel } = await shipping
      .from("shipment_parcels")
      .select("id")
      .eq("shipping_record_id", recordId)
      .eq("parcel_number", n)
      .maybeSingle();

    if (existingParcel) continue;

    const tracking = generateDemoTrackingNumber(`${input.orderNumber}-P${n}`);
    await shipping.from("shipment_parcels").insert({
      shipping_record_id: recordId,
      parcel_number: n,
      total_parcels: totalParcels,
      weight_kg: 1.2,
      length_cm: 30,
      width_cm: 20,
      height_cm: 10,
      carrier: "Royal Mail",
      shipping_service: "Demo Tracked 48",
      tracking_number: tracking,
      tracking_url: `https://demo.rovexo.co.uk/tracking/${tracking}`,
      status: input.delivered ? "delivered" : "in_transit",
      estimated_delivery_at: generateDemoDeliveryDate(n + 1),
    });
    parcelsCreated += 1;
  }

  return parcelsCreated;
}

async function ensureOrderBucket(input: {
  admin: SupabaseClient<Database>;
  liveBuyer: DemoUserRecord;
  products: ProductRow[];
  bucket: OrderBucket;
  target: number;
  addressId: string | null;
}): Promise<{ orders: number; reviews: number; disputes: number; parcels: number }> {
  const prefix = `FULLDEMO-${input.bucket.toUpperCase()}-`;
  const existing = await countOrdersByPrefix(input.admin, prefix);
  const needed = Math.max(0, input.target - existing);
  const spec = BUCKET_SPECS[input.bucket];

  let orders = 0;
  let reviews = 0;
  let disputes = 0;
  let parcels = 0;

  for (let i = 0; i < needed; i += 1) {
    const seq = existing + i + 1;
    const orderKey = `${prefix}${String(seq).padStart(3, "0")}`;
    const product = input.products[(seq - 1) % input.products.length]!;
    const itemPrice = Number(product.price);
    const deliveryFee = 4.99;
    const total = Number((itemPrice + deliveryFee).toFixed(2));
    const now = new Date();
    const paidAt = spec.paid ? now.toISOString() : null;
    const shippedAt = spec.shipped ? new Date(now.getTime() - 86400000 * 2).toISOString() : null;
    const deliveredAt = spec.delivered
      ? new Date(now.getTime() - 43200000).toISOString()
      : null;

    const { data: order, error } = await input.admin
      .from("orders")
      .insert({
        order_number: orderKey,
        buyer_id: input.liveBuyer.id,
        seller_id: product.seller_id,
        status: spec.status,
        delivery_carrier: "Royal Mail",
        tracking_number: spec.shipped ? generateDemoTrackingNumber(orderKey) : null,
        item_price: itemPrice,
        protected_fee: 1.25,
        delivery_fee: deliveryFee,
        total,
        shipping_address_id: input.addressId,
        paid_at: paidAt,
        shipped_at: shippedAt,
        delivered_at: deliveredAt,
        completed_at: spec.status === "completed" ? deliveredAt : null,
        refunded_at: spec.refunded ? now.toISOString() : null,
        refunded_amount: spec.refunded ? total : null,
      })
      .select("id")
      .single();

    if (error || !order) {
      throw new Error(`Failed to seed ${orderKey}: ${error?.message ?? "unknown"}`);
    }

    await input.admin.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      title: product.title,
      slug: product.slug,
      price: itemPrice,
      image_url: demoProductImageUrl(`${product.slug}-${orderKey}`),
      condition: "good",
      quantity: 1,
    });
    orders += 1;

    if (spec.tracking) {
      parcels += await seedShippingForOrder({
        orderId: order.id,
        orderNumber: orderKey,
        index: seq,
        delivered: Boolean(spec.delivered),
      });
    }

    if (spec.disputed) {
      await input.admin.from("protection_cases").insert({
        order_id: order.id,
        buyer_id: input.liveBuyer.id,
        seller_id: product.seller_id,
        case_type: "dispute",
        status: "open",
        outcome: "pending",
        reason: "Full Demo dispute scenario",
        description: "Permanent certification dispute inventory.",
      } as never);
      disputes += 1;
    }

    if (spec.review) {
      await input.admin.from("reviews").insert({
        order_id: order.id,
        reviewer_id: input.liveBuyer.id,
        reviewee_id: product.seller_id,
        product_id: product.id,
        rating: 4 + (seq % 2),
        comment: "Full Demo Certification — permanent review inventory.",
      });
      reviews += 1;
    }
  }

  return { orders, reviews, disputes, parcels };
}

async function ensureWalletFloor(
  admin: SupabaseClient<Database>,
  userId: string,
  target: number,
): Promise<void> {
  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (!wallet) {
    await admin.from("wallets").insert({
      user_id: userId,
      available_balance: target,
      pending_balance: 0,
    });
    return;
  }

  await admin
    .from("wallets")
    .update({ available_balance: target })
    .eq("id", wallet.id);
}

export async function seedFullDemoMarketplaceData(input: {
  admin: SupabaseClient<Database>;
  liveBuyer: DemoUserRecord;
  liveSeller: DemoUserRecord;
  productIds: string[];
}): Promise<{
  orders: number;
  conversations: number;
  notifications: number;
  savedItems: number;
  reviews: number;
  walletTransactions: number;
  offers: number;
  counterOffers: number;
  disputes: number;
  parcels: number;
  promotions: number;
  analyticsEvents: number;
}> {
  const products = await loadSellerProducts(input.admin, input.liveSeller.id);
  const addressId = await defaultAddressId(input.admin, input.liveBuyer.id);

  let orders = 0;
  let reviews = 0;
  let disputes = 0;
  let parcels = 0;
  let conversations = 0;
  let notifications = 0;
  let savedItems = 0;
  let walletTransactions = 0;
  let offers = 0;
  let counterOffers = 0;
  let promotions = 0;
  let analyticsEvents = 0;

  const buckets: Array<{ bucket: OrderBucket; target: number }> = [
    { bucket: "completed", target: FULL_DEMO_BUYER_QUOTAS.completedOrders },
    { bucket: "cancelled", target: FULL_DEMO_BUYER_QUOTAS.cancelledOrders },
    { bucket: "refunded", target: FULL_DEMO_BUYER_QUOTAS.refundedOrders },
    { bucket: "delivered", target: FULL_DEMO_BUYER_QUOTAS.deliveredOrders },
    { bucket: "disputed", target: FULL_DEMO_BUYER_QUOTAS.disputes },
  ];

  for (const entry of buckets) {
    const result = await ensureOrderBucket({
      admin: input.admin,
      liveBuyer: input.liveBuyer,
      products,
      bucket: entry.bucket,
      target: entry.target,
      addressId,
    });
    orders += result.orders;
    reviews += result.reviews;
    disputes += result.disputes;
    parcels += result.parcels;
  }

  // Offers + counter offers
  const offerTarget = FULL_DEMO_SELLER_QUOTAS.offers;
  const counterTarget = FULL_DEMO_SELLER_QUOTAS.counterOffers;
  const { count: existingOffers } = await input.admin
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", input.liveBuyer.id)
    .eq("seller_id", input.liveSeller.id);

  const offersNeeded = Math.max(0, offerTarget - (existingOffers ?? 0));
  for (let i = 0; i < offersNeeded; i += 1) {
    const product = products[i % products.length]!;
    const statuses = ["pending", "accepted", "rejected", "expired"] as const;
    await input.admin.from("offers").insert({
      product_id: product.id,
      buyer_id: input.liveBuyer.id,
      seller_id: input.liveSeller.id,
      amount: Number((Number(product.price) * 0.85).toFixed(2)),
      status: statuses[i % statuses.length],
      message: "Full Demo offer for certification.",
    } as never);
    offers += 1;
  }

  const { count: existingCounters } = await input.admin
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", input.liveBuyer.id)
    .eq("seller_id", input.liveSeller.id)
    .ilike("message", "Counter offer%");

  const countersNeeded = Math.max(0, counterTarget - (existingCounters ?? 0));
  for (let i = 0; i < countersNeeded; i += 1) {
    const product = products[(i + 7) % products.length]!;
    await input.admin.from("offers").insert({
      product_id: product.id,
      buyer_id: input.liveBuyer.id,
      seller_id: input.liveSeller.id,
      amount: Number((Number(product.price) * 0.9).toFixed(2)),
      status: "cancelled",
      message: "Original offer (superseded by counter).",
    } as never);
    await input.admin.from("offers").insert({
      product_id: product.id,
      buyer_id: input.liveBuyer.id,
      seller_id: input.liveSeller.id,
      amount: Number((Number(product.price) * 0.92).toFixed(2)),
      status: "pending",
      message: "Counter offer: Full Demo certification.",
    } as never);
    counterOffers += 1;
  }

  // Messages / conversations
  for (let i = 0; i < Math.min(FULL_DEMO_BUYER_QUOTAS.messages, products.length); i += 1) {
    const product = products[i]!;
    const { data: existingConversation } = await input.admin
      .from("conversations")
      .select("id")
      .eq("product_id", product.id)
      .eq("buyer_id", input.liveBuyer.id)
      .eq("seller_id", input.liveSeller.id)
      .maybeSingle();

    let conversationId = existingConversation?.id ?? null;
    if (!conversationId) {
      const { data: conversation } = await input.admin
        .from("conversations")
        .insert({
          product_id: product.id,
          buyer_id: input.liveBuyer.id,
          seller_id: input.liveSeller.id,
          last_message: "Full Demo Inbox Hub message",
          last_message_at: new Date().toISOString(),
          buyer_unread_count: 1,
          seller_unread_count: 1,
        })
        .select("id")
        .single();

      if (conversation) {
        conversationId = conversation.id;
        conversations += 1;
        await input.admin.from("messages").insert([
          {
            conversation_id: conversation.id,
            sender_id: input.liveBuyer.id,
            sender_role: "buyer",
            kind: "text",
            content: "Full Demo — interested in this listing.",
            status: "sent",
          },
          {
            conversation_id: conversation.id,
            sender_id: input.liveSeller.id,
            sender_role: "seller",
            kind: "text",
            content: "Full Demo — happy to help. Offer or Buy Now available.",
            status: "sent",
          },
        ]);
      }
    }

    await input.admin.from("saved_items").upsert(
      {
        user_id: input.liveBuyer.id,
        product_id: product.id,
        saved_at: new Date(Date.now() - i * 3600000).toISOString(),
      },
      { onConflict: "user_id,product_id" },
    );
    savedItems += 1;
  }

  // Notifications
  for (let i = 0; i < FULL_DEMO_BUYER_QUOTAS.notifications; i += 1) {
    await createNotification({
      userId: input.liveBuyer.id,
      type: i % 2 === 0 ? "order" : "message",
      title: `Full Demo buyer update #${i + 1}`,
      subtitle: "Permanent certification notification.",
      href: i % 2 === 0 ? "/orders" : "/messages",
    });
    notifications += 1;
  }
  for (let i = 0; i < FULL_DEMO_SELLER_QUOTAS.notifications; i += 1) {
    await createNotification({
      userId: input.liveSeller.id,
      type: i % 2 === 0 ? "order" : "offer",
      title: `Full Demo seller update #${i + 1}`,
      subtitle: "Permanent certification notification.",
      href: i % 2 === 0 ? "/orders" : "/messages",
    });
    notifications += 1;
  }

  // Promotions + analytics (source must match listing_promotions CHECK constraint)
  const PROMO_SOURCE = "internal" as const;
  const promoProducts = products.slice(0, FULL_DEMO_SELLER_QUOTAS.promotions);
  for (const product of promoProducts) {
    const { data: existingPromo } = await input.admin
      .from("listing_promotions")
      .select("id")
      .eq("product_id", product.id)
      .eq("seller_id", input.liveSeller.id)
      .eq("source", PROMO_SOURCE)
      .maybeSingle();

    if (existingPromo) {
      promotions += 1;
      continue;
    }

    const endsAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data: promo, error: promoError } = await input.admin
      .from("listing_promotions")
      .insert({
        product_id: product.id,
        seller_id: input.liveSeller.id,
        type: "bump",
        duration_id: "7d",
        amount_cents: 299,
        status: "active",
        source: PROMO_SOURCE,
        starts_at: new Date().toISOString(),
        ends_at: endsAt,
        reason: "Full Demo Certification promotion",
      })
      .select("id")
      .single();

    if (promoError) {
      throw new Error(
        `Full Demo promotion seed failed for product ${product.id}: ${promoError.message}`,
      );
    }

    if (promo) {
      promotions += 1;
      await input.admin.from("products").update({
        bumped_until: endsAt,
        last_bumped_at: new Date().toISOString(),
        bump_count: 1,
      }).eq("id", product.id);

      for (let e = 0; e < 5; e += 1) {
        await input.admin.from("promotion_analytics_events").insert({
          seller_id: input.liveSeller.id,
          product_id: product.id,
          promotion_id: promo.id,
          event_type: e % 2 === 0 ? "impression" : "click",
          surface: "homepage",
        });
        analyticsEvents += 1;
      }
    }
  }

  // Ensure promotion floor even if products were already promo'd under another source
  const { count: promoCount } = await input.admin
    .from("listing_promotions")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", input.liveSeller.id);
  promotions = Math.max(promotions, promoCount ?? 0);

  if ((promoCount ?? 0) < FULL_DEMO_SELLER_QUOTAS.promotions) {
    const needed = FULL_DEMO_SELLER_QUOTAS.promotions - (promoCount ?? 0);
    for (let i = 0; i < needed; i += 1) {
      const product = products[i % products.length];
      if (!product) break;
      const endsAt = new Date(Date.now() + 7 * 86400000).toISOString();
      const { data: promo, error: promoError } = await input.admin
        .from("listing_promotions")
        .insert({
          product_id: product.id,
          seller_id: input.liveSeller.id,
          type: i % 2 === 0 ? "bump" : "feature",
          duration_id: "7d",
          amount_cents: 299,
          status: "active",
          source: PROMO_SOURCE,
          starts_at: new Date().toISOString(),
          ends_at: endsAt,
          reason: `Full Demo Certification promotion top-up #${i + 1}`,
        })
        .select("id")
        .single();
      if (promoError) {
        throw new Error(
          `Full Demo promotion top-up failed: ${promoError.message}`,
        );
      }
      if (promo) promotions += 1;
    }
  }

  // Top up analytics to floor if promotions already existed
  const { count: analyticsCount } = await input.admin
    .from("promotion_analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", input.liveSeller.id);

  const analyticsNeeded = Math.max(
    0,
    FULL_DEMO_SELLER_QUOTAS.analyticsEvents - (analyticsCount ?? 0),
  );
  for (let i = 0; i < analyticsNeeded; i += 1) {
    const product = products[i % products.length]!;
    await input.admin.from("promotion_analytics_events").insert({
      seller_id: input.liveSeller.id,
      product_id: product.id,
      promotion_id: null,
      event_type: i % 2 === 0 ? "impression" : "click",
      surface: "search",
    });
    analyticsEvents += 1;
  }

  // Wallet floors + seed transactions
  await ensureWalletFloor(input.admin, input.liveBuyer.id, FULL_DEMO_VIRTUAL_FUNDS_GBP);
  await ensureWalletFloor(input.admin, input.liveSeller.id, FULL_DEMO_VIRTUAL_FUNDS_GBP);

  for (const user of [input.liveBuyer, input.liveSeller]) {
    const { data: wallet } = await input.admin
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!wallet) continue;

    const orderNumber = `FULLDEMO-WALLET-${user.key.toUpperCase()}`;
    const { data: existingTx } = await input.admin
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!existingTx) {
      await input.admin.from("wallet_transactions").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: "sale",
        status: "completed",
        amount: 250,
        fee_amount: 0,
        product_title: "Full Demo Wallet Seed",
        product_image_url: demoProductImageUrl("fulldemo-wallet"),
        order_number: orderNumber,
        description: "Virtual wallet activity for Full Demo Certification.",
      });
      walletTransactions += 1;
    }
  }

  return {
    orders,
    conversations,
    notifications,
    savedItems,
    reviews,
    walletTransactions,
    offers,
    counterOffers,
    disputes,
    parcels,
    promotions,
    analyticsEvents,
  };
}
