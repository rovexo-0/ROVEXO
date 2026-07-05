import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { DemoUserRecord } from "@/lib/demo-environment/users";
import { demoProductImageUrl } from "@/lib/demo-environment/config";
import { createNotification } from "@/lib/notifications/create";

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  seller_id: string;
  price: number;
};

const ORDER_STATUSES: Array<{
  status: Database["public"]["Enums"]["order_status"];
  paid?: boolean;
  shipped?: boolean;
  delivered?: boolean;
}> = [
  { status: "awaiting_payment" },
  { status: "awaiting_shipment", paid: true },
  { status: "awaiting_shipment", paid: true },
  { status: "shipped", paid: true, shipped: true },
  { status: "delivered", paid: true, shipped: true, delivered: true },
  { status: "completed", paid: true, shipped: true, delivered: true },
  { status: "cancelled" },
  { status: "issue_open", paid: true, shipped: true },
];

async function loadProducts(admin: SupabaseClient<Database>, limit = 80): Promise<ProductRow[]> {
  const { data, error } = await admin
    .from("products")
    .select("id, slug, title, seller_id, price")
    .like("slug", "demo-%")
    .eq("status", "published")
    .limit(limit);

  if (error || !data?.length) {
    throw new Error("Demo marketplace seed requires demo listings.");
  }

  return data as ProductRow[];
}

async function defaultAddressId(admin: SupabaseClient<Database>, userId: string): Promise<string | null> {
  const { data } = await admin
    .from("shipping_addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function seedDemoMarketplaceData(input: {
  admin: SupabaseClient<Database>;
  buyers: DemoUserRecord[];
  sellers: DemoUserRecord[];
  productIds: string[];
}): Promise<{
  orders: number;
  conversations: number;
  notifications: number;
  savedItems: number;
  reviews: number;
  walletTransactions: number;
}> {
  const products = await loadProducts(input.admin, 80);
  let orders = 0;
  let conversations = 0;
  let notifications = 0;
  let savedItems = 0;
  let reviews = 0;
  let walletTransactions = 0;

  for (let i = 0; i < Math.min(ORDER_STATUSES.length * input.buyers.length, products.length); i += 1) {
    const buyer = input.buyers[i % input.buyers.length]!;
    const product = products[i % products.length]!;
    const statusSpec = ORDER_STATUSES[i % ORDER_STATUSES.length]!;
    const orderKey = `DEMO-${buyer.key.toUpperCase()}-${String(i + 1).padStart(3, "0")}`;

    const { data: existingOrder } = await input.admin
      .from("orders")
      .select("id")
      .eq("order_number", orderKey)
      .maybeSingle();

    let orderId = existingOrder?.id ?? null;

    if (!orderId) {
      const itemPrice = Number(product.price);
      const deliveryFee = 4.99;
      const total = Number((itemPrice + deliveryFee).toFixed(2));
      const addressId = await defaultAddressId(input.admin, buyer.id);
      const now = new Date();
      const paidAt = statusSpec.paid ? now.toISOString() : null;
      const shippedAt = statusSpec.shipped
        ? new Date(now.getTime() - 86400000).toISOString()
        : null;
      const deliveredAt = statusSpec.delivered
        ? new Date(now.getTime() - 43200000).toISOString()
        : null;

      const { data: order, error } = await input.admin
        .from("orders")
        .insert({
          order_number: orderKey,
          buyer_id: buyer.id,
          seller_id: product.seller_id,
          status: statusSpec.status,
          delivery_carrier: "Royal Mail",
          tracking_number: statusSpec.shipped ? `TT${orderKey.replace(/-/g, "")}` : null,
          item_price: itemPrice,
          protected_fee: 1.25,
          delivery_fee: deliveryFee,
          total,
          shipping_address_id: addressId,
          paid_at: paidAt,
          shipped_at: shippedAt,
          delivered_at: deliveredAt,
          completed_at: statusSpec.status === "completed" ? deliveredAt : null,
        })
        .select("id")
        .single();

      if (error || !order) {
        throw new Error(`Failed to seed demo order ${orderKey}: ${error?.message ?? "unknown"}`);
      }

      orderId = order.id;

      await input.admin.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        title: product.title,
        slug: product.slug,
        price: itemPrice,
        image_url: demoProductImageUrl(`${product.slug}-order`),
        condition: "good",
        quantity: 1,
      });

      orders += 1;
    }

    if (statusSpec.status === "completed" || statusSpec.status === "delivered") {
      const { data: existingReview } = await input.admin
        .from("reviews")
        .select("id")
        .eq("order_id", orderId!)
        .maybeSingle();

      if (!existingReview) {
        await input.admin.from("reviews").insert({
          order_id: orderId!,
          reviewer_id: buyer.id,
          reviewee_id: product.seller_id,
          product_id: product.id,
          rating: 4 + (i % 2),
          comment: "Excellent demo transaction — item as described.",
        });
        reviews += 1;
      }
    }
  }

  for (let i = 0; i < 24; i += 1) {
    const buyer = input.buyers[i % input.buyers.length]!;
    const product = products[i % products.length]!;

    const { error: savedError } = await input.admin.from("saved_items").upsert(
      {
        user_id: buyer.id,
        product_id: product.id,
        saved_at: new Date(Date.now() - i * 3600000).toISOString(),
      },
      { onConflict: "user_id,product_id" },
    );

    if (!savedError) savedItems += 1;

    const { data: existingConversation } = await input.admin
      .from("conversations")
      .select("id")
      .eq("product_id", product.id)
      .eq("buyer_id", buyer.id)
      .eq("seller_id", product.seller_id)
      .maybeSingle();

    let conversationId = existingConversation?.id ?? null;

    if (!conversationId) {
      const { data: conversation, error: conversationError } = await input.admin
        .from("conversations")
        .insert({
          product_id: product.id,
          buyer_id: buyer.id,
          seller_id: product.seller_id,
          last_message: "Hi, is this demo item still available?",
          last_message_at: new Date().toISOString(),
          buyer_unread_count: i % 2,
          seller_unread_count: i % 3,
        })
        .select("id")
        .single();

      if (conversationError || !conversation) continue;
      conversationId = conversation.id;
      conversations += 1;
    }

    if (conversationId) {
      await input.admin.from("messages").insert({
        conversation_id: conversationId,
        sender_id: buyer.id,
        sender_role: "buyer",
        kind: "text",
        content: "Hello — I'd like to buy this demo listing for QA testing.",
        status: "sent",
      });
      await input.admin.from("messages").insert({
        conversation_id: conversationId,
        sender_id: product.seller_id,
        sender_role: "seller",
        kind: "text",
        content: "Thanks for your message. This demo listing is available.",
        status: "sent",
      });
    }
  }

  for (const buyer of input.buyers) {
    await createNotification({
      userId: buyer.id,
      type: "order",
      title: "Demo order update",
      subtitle: "Your demo marketplace order is ready for QA review.",
      href: "/orders",
    });
    await createNotification({
      userId: buyer.id,
      type: "message",
      title: "New demo message",
      subtitle: "A seller replied in your demo conversation.",
      href: "/messages",
    });
    notifications += 2;
  }

  for (const seller of input.sellers) {
    const { data: wallet } = await input.admin
      .from("wallets")
      .select("id, available_balance, pending_balance")
      .eq("user_id", seller.id)
      .single();

    if (!wallet) continue;

    await input.admin
      .from("wallets")
      .update({
        available_balance: 1250.5,
        pending_balance: 180.25,
        pending_available_at: new Date(Date.now() + 86400000 * 3).toISOString(),
      })
      .eq("id", wallet.id);

    const { data: existingTx } = await input.admin
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", seller.id)
      .eq("order_number", "DEMO-WALLET-001")
      .maybeSingle();

    if (!existingTx) {
      await input.admin.from("wallet_transactions").insert({
        user_id: seller.id,
        wallet_id: wallet.id,
        type: "sale",
        status: "completed",
        amount: 49.99,
        fee_amount: 4.99,
        product_title: "Demo Wallet Sale",
        product_image_url: demoProductImageUrl("wallet-sale"),
        order_number: "DEMO-WALLET-001",
        description: "Demo wallet credit for QA certification.",
      });
      walletTransactions += 1;
    }
  }

  return { orders, conversations, notifications, savedItems, reviews, walletTransactions };
}
