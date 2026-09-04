import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { resolveCardImageSources } from "@/lib/media/product-image";
import type { Notification } from "@/lib/notifications/types";
import { extractConversationIdFromNotificationHref } from "@/lib/inbox/notification-listing-thumb";

type ProductImageRow = {
  url: string | null;
  thumbnail_url?: string | null;
  storage_path?: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
};

const PRODUCT_IMAGES_SELECT = "url, thumbnail_url, storage_path, is_primary, sort_order";

function sortedPrimaryImage(images: ProductImageRow[] | null | undefined): ProductImageRow | undefined {
  return [...(images ?? [])].sort(
    (a, b) =>
      Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0),
  )[0];
}

function resolvePrimaryListingImage(
  images: ProductImageRow[] | null | undefined,
  productStatus?: string | null,
): string {
  const primary = sortedPrimaryImage(images);
  return resolveCardImageSources(primary?.thumbnail_url, primary?.url, {
    storagePath: primary?.storage_path,
    productStatus,
  }).imageUrl;
}

function resolveSnapshotListingImage(
  snapshotUrl: string | null | undefined,
  listing?: { imageUrl: string; productStatus?: string | null; storagePath?: string | null } | null,
): string {
  if (listing?.imageUrl) return listing.imageUrl;
  return resolveCardImageSources(snapshotUrl, snapshotUrl, {
    storagePath: listing?.storagePath,
    productStatus: listing?.productStatus,
  }).imageUrl;
}

function isProductsBucketJpegOrPng(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (!parsed.pathname.includes("/storage/v1/object/") || !parsed.pathname.includes("/products/")) {
      return false;
    }
    return /\.(jpe?g|png)(?:\?|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Spring 2 — if a commerce notification lacks product image / title,
 * resolve from order / listing / conversation href so Inbox shows product thumbs.
 * Batch queries only — never N+1 per notification.
 */
export async function enrichNotificationProductMedia(
  notifications: Notification[],
): Promise<Notification[]> {
  if (!notifications.length) return notifications;

  const needs = notifications.filter(
    (item) =>
      item.type !== "system" &&
      item.type !== "moderation" &&
      (!isRenderableImageSrc(item.avatarUrl) ||
        !item.avatarName?.trim() ||
        isProductsBucketJpegOrPng(item.avatarUrl)),
  );
  if (!needs.length) return notifications;

  const admin = tryCreateAdminClient();
  const supabase = admin ?? (await createClient());

  const orderIds = new Set<string>();
  const listingSlugs = new Set<string>();
  const conversationIds = new Set<string>();

  for (const item of needs) {
    const orderFromQuery = item.href.match(/[?&]order=([^&#]+)/);
    if (orderFromQuery?.[1]) {
      orderIds.add(decodeURIComponent(orderFromQuery[1]));
    }
    const orderMatch = item.href.match(/\/orders\/([^/?#]+)/);
    if (orderMatch?.[1] && orderMatch[1] !== "tracking") {
      orderIds.add(orderMatch[1]);
    }
    const listingMatch = item.href.match(/\/listing\/([^/?#]+)/);
    if (listingMatch?.[1]) {
      listingSlugs.add(decodeURIComponent(listingMatch[1]));
    }
    const checkoutMatch = item.href.match(/\/checkout\/([^/?#]+)/);
    if (checkoutMatch?.[1]) {
      listingSlugs.add(decodeURIComponent(checkoutMatch[1]));
    }
    const conversationId = extractConversationIdFromNotificationHref(item.href);
    if (conversationId) conversationIds.add(conversationId);
  }

  type ListingImageMeta = {
    title: string;
    imageUrl: string;
    productStatus?: string | null;
    storagePath?: string | null;
  };

  const orderImageById = new Map<string, { title: string; snapshotUrl: string; slug?: string }>();
  const listingImageBySlug = new Map<string, ListingImageMeta>();
  const conversationImageById = new Map<string, ListingImageMeta>();

  if (orderIds.size) {
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, title, image_url, slug")
      .in("order_id", [...orderIds]);
    for (const row of items ?? []) {
      if (!orderImageById.has(row.order_id)) {
        orderImageById.set(row.order_id, {
          title: row.title?.trim() || "",
          snapshotUrl: row.image_url?.trim() || "",
          slug: row.slug?.trim() || undefined,
        });
      }
      if (row.slug) {
        listingSlugs.add(row.slug);
      }
    }
  }

  if (conversationIds.size) {
    const { data: conversations } = await supabase
      .from("conversations")
      .select(`id, products ( slug, title, status, product_images ( ${PRODUCT_IMAGES_SELECT} ) )`)
      .in("id", [...conversationIds]);

    for (const row of conversations ?? []) {
      const product = (
        row as {
          id: string;
          products?: {
            slug?: string;
            title?: string | null;
            status?: string | null;
            product_images?: ProductImageRow[];
          } | null;
        }
      ).products;
      if (!product) continue;
      const imageUrl = resolvePrimaryListingImage(product.product_images, product.status);
      const primary = sortedPrimaryImage(product.product_images);
      const title = product.title?.trim() || "";
      const meta: ListingImageMeta = {
        title,
        imageUrl,
        productStatus: product.status,
        storagePath: primary?.storage_path,
      };
      conversationImageById.set(row.id, meta);
      if (product.slug) {
        listingSlugs.add(product.slug);
        if (imageUrl || title) {
          listingImageBySlug.set(product.slug, meta);
        }
      }
    }
  }

  if (listingSlugs.size) {
    const { data: products } = await supabase
      .from("products")
      .select(`slug, title, status, product_images ( ${PRODUCT_IMAGES_SELECT} )`)
      .in("slug", [...listingSlugs]);
    for (const product of products ?? []) {
      const images = (
        product as {
          product_images?: ProductImageRow[];
        }
      ).product_images;
      const primary = sortedPrimaryImage(images);
      listingImageBySlug.set(product.slug, {
        title: product.title?.trim() || "",
        imageUrl: resolvePrimaryListingImage(images, product.status),
        productStatus: product.status,
        storagePath: primary?.storage_path,
      });
    }
  }

  return notifications.map((item) => {
    const alreadySafe =
      isRenderableImageSrc(item.avatarUrl) &&
      item.avatarName?.trim() &&
      !isProductsBucketJpegOrPng(item.avatarUrl);
    if (alreadySafe) {
      return item;
    }

    const orderFromQuery = item.href.match(/[?&]order=([^&#]+)/);
    const orderMatch = item.href.match(/\/orders\/([^/?#]+)/);
    const orderId =
      (orderFromQuery?.[1] ? decodeURIComponent(orderFromQuery[1]) : undefined) ||
      (orderMatch?.[1] && orderMatch[1] !== "tracking" ? orderMatch[1] : undefined);
    const orderRow = orderId ? orderImageById.get(orderId) : undefined;
    const listingMatch =
      item.href.match(/\/listing\/([^/?#]+)/) ?? item.href.match(/\/checkout\/([^/?#]+)/);
    const listingMeta = listingMatch?.[1]
      ? listingImageBySlug.get(decodeURIComponent(listingMatch[1]))
      : orderRow?.slug
        ? listingImageBySlug.get(orderRow.slug)
        : undefined;
    const conversationId = extractConversationIdFromNotificationHref(item.href);
    const conversationMeta = conversationId
      ? conversationImageById.get(conversationId)
      : undefined;

    const title =
      item.avatarName?.trim() ||
      conversationMeta?.title ||
      orderRow?.title ||
      listingMeta?.title ||
      "";

    const listingForSnapshot = listingMeta ?? conversationMeta;
    const snapshotResolved = orderRow
      ? resolveSnapshotListingImage(orderRow.snapshotUrl, listingForSnapshot)
      : "";
    const existingResolved = isProductsBucketJpegOrPng(item.avatarUrl)
      ? resolveSnapshotListingImage(item.avatarUrl, listingForSnapshot)
      : isRenderableImageSrc(item.avatarUrl)
        ? item.avatarUrl
        : "";

    const imageUrl =
      existingResolved ||
      conversationMeta?.imageUrl ||
      snapshotResolved ||
      listingMeta?.imageUrl ||
      "";

    if (!title && !imageUrl) return item;

    return {
      ...item,
      avatarName: title || item.avatarName,
      avatarUrl: imageUrl || item.avatarUrl,
    };
  });
}
