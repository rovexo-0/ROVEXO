/**
 * Realtime Certification fixtures — seller published listing via session APIs only.
 * No SQL audits. No admin wallet mutation.
 */
import type { Page } from "@playwright/test";

const SAMPLE_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

const CATEGORY_SLUGS = ["home-garden", "bedding", "pillows"];

export type SellerListingFixture = {
  id: string;
  slug: string;
  title: string;
  price: number;
  acceptOffers: boolean;
};

type ListingRow = {
  id?: string;
  slug?: string;
  title?: string;
  price?: number;
  acceptOffers?: boolean;
  status?: string;
  stock?: number;
};

export async function ensureSellerPublishedListing(
  sellerPage: Page,
  options?: { forceCreate?: boolean },
): Promise<SellerListingFixture | null> {
  if (!options?.forceCreate) {
    const listRes = await sellerPage.request.get("/api/listings?filter=published");
    if (listRes.ok()) {
      const body = (await listRes.json()) as { listings?: ListingRow[] };
      const hit = (body.listings ?? []).find(
        (row) =>
          row.id &&
          row.slug &&
          row.acceptOffers !== false &&
          (row.stock == null || row.stock > 0),
      );
      if (hit?.id && hit.slug) {
        if (hit.status === "paused") {
          await sellerPage.request.post(`/api/listings/${hit.id}/status`, {
            data: { action: "reactivate" },
          });
        }
        return {
          id: hit.id,
          slug: hit.slug,
          title: hit.title ?? hit.slug,
          price: Number(hit.price ?? 10),
          acceptOffers: hit.acceptOffers !== false,
        };
      }
    }
  }

  const jpeg = Buffer.from(SAMPLE_JPEG_BASE64, "base64");
  const sessionId = `rt-cert-${Date.now()}`;
  const upload = await sellerPage.request.post("/api/listings/upload", {
    multipart: {
      file: { name: "rt-full.jpg", mimeType: "image/jpeg", buffer: jpeg },
      thumbnail: { name: "rt-thumb.jpg", mimeType: "image/jpeg", buffer: jpeg },
      sessionId,
    },
  });
  if (!upload.ok()) return null;
  const uploaded = (await upload.json()) as {
    url?: string;
    storagePath?: string;
    path?: string;
    publicUrl?: string;
  };
  const url = uploaded.url ?? uploaded.publicUrl;
  const storagePath = uploaded.storagePath ?? uploaded.path;
  if (!url || !storagePath) return null;

  const title = `Premium Cotton Pillow ${Date.now()}`;
  const create = await sellerPage.request.post("/api/listings", {
    data: {
      title,
      description:
        "Soft cotton pillow for everyday use. Clean item in excellent condition ready to ship.",
      condition: "new",
      price: 29.99,
      acceptOffers: true,
      freeDelivery: true,
      shippingMethod: "delivery_available",
      shippingPrice: 0,
      deliveryCarriers: ["Royal Mail"],
      parcelSize: "small",
      status: "published",
      categoryPath: {
        categorySlug: CATEGORY_SLUGS[0],
        subcategorySlug: CATEGORY_SLUGS[1],
        childCategorySlug: CATEGORY_SLUGS[2],
        categorySlugs: CATEGORY_SLUGS,
      },
      inventory: { sku: `PILLOW-${Date.now()}`, stock: 5, lowStockAlert: 1 },
      images: [
        {
          url,
          storagePath,
          sortOrder: 0,
          isPrimary: true,
        },
      ],
    },
  });
  if (!create.ok()) return null;
  const created = (await create.json()) as {
    listing?: { id?: string; slug?: string; price?: number };
  };
  if (!created.listing?.id || !created.listing.slug) return null;
  return {
    id: created.listing.id,
    slug: created.listing.slug,
    title,
    price: Number(created.listing.price ?? 29.99),
    acceptOffers: true,
  };
}

export async function openOfferConversation(
  buyerPage: Page,
  listing: SellerListingFixture,
): Promise<{ conversationId: string; productSlug: string; price: number } | null> {
  const create = await buyerPage.request.post("/api/messages", {
    data: { productSlug: listing.slug },
  });
  if (!create.ok()) return null;
  const body = (await create.json()) as { conversationId?: string };
  if (!body.conversationId) return null;
  return {
    conversationId: body.conversationId,
    productSlug: listing.slug,
    price: listing.price,
  };
}

/**
 * Buy Now → Confirm & Pay (virtual card) → awaiting_shipment order.
 * Session APIs only — mirrors Full Demo checkout without admin SQL.
 */
export async function ensureBuyerShippableOrder(
  buyerPage: Page,
  listing: SellerListingFixture,
): Promise<{ orderId: string; status: string; conversationId: string | null } | null> {
  const buyNow = await buyerPage.request.post("/api/checkout/buy-now", {
    data: { productSlug: listing.slug },
  });
  if (!buyNow.ok()) return null;
  const buyBody = (await buyNow.json()) as {
    success?: boolean;
    checkoutSessionId?: string;
    orderId?: string | null;
  };
  if (!buyBody.success || !buyBody.checkoutSessionId) return null;

  const addrList = await buyerPage.request.get("/api/addresses?type=shipping");
  let shippingAddressId: string | null = null;
  if (addrList.ok()) {
    const addrBody = (await addrList.json()) as {
      addresses?: { id?: string }[];
    };
    shippingAddressId = addrBody.addresses?.find((a) => a.id)?.id ?? null;
  }
  if (!shippingAddressId) {
    const created = await buyerPage.request.post("/api/addresses", {
      data: {
        recipientName: "Demo Buyer",
        addressLine: "10 Downing Street",
        city: "London",
        postcode: "SW1A 2AA",
        country: "United Kingdom",
        addressType: "shipping",
        isDefault: true,
      },
    });
    if (!created.ok()) return null;
    const createdBody = (await created.json()) as { address?: { id?: string } };
    shippingAddressId = createdBody.address?.id ?? null;
  }
  if (!shippingAddressId) return null;

  const idempotencyKey = `rt_ship_${buyBody.checkoutSessionId}`;
  const checkout = await buyerPage.request.post("/api/orders/checkout", {
    data: {
      productSlug: listing.slug,
      deliveryOption: "delivery_available",
      checkoutSessionId: buyBody.checkoutSessionId,
      shippingAddressId,
      paymentMethod: "card",
      idempotencyKey,
    },
    headers: { "Idempotency-Key": idempotencyKey },
  });
  if (!checkout.ok()) return null;
  const checkoutBody = (await checkout.json()) as {
    success?: boolean;
    orderId?: string;
  };
  if (!checkoutBody.success || !checkoutBody.orderId) return null;

  let status = "awaiting_shipment";
  let conversationId: string | null = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const ordersRes = await buyerPage.request.get("/api/orders");
    if (ordersRes.ok()) {
      const body = (await ordersRes.json()) as {
        orders?: { id?: string; status?: string; conversationId?: string }[];
      };
      const hit = body.orders?.find((o) => o.id === checkoutBody.orderId);
      if (hit?.status) {
        status = hit.status;
        conversationId = hit.conversationId ?? conversationId;
        if (status === "awaiting_shipment" || status === "shipped") break;
      }
    }
    await buyerPage.waitForTimeout(500);
  }

  if (!conversationId) {
    const msgs = await buyerPage.request.get("/api/messages");
    if (msgs.ok()) {
      const body = (await msgs.json()) as {
        conversations?: { id?: string; orderId?: string }[];
      };
      conversationId =
        body.conversations?.find((c) => c.orderId === checkoutBody.orderId)?.id ?? null;
    }
  }

  if (status !== "awaiting_shipment" && status !== "shipped") {
    return null;
  }

  return { orderId: checkoutBody.orderId, status, conversationId };
}
