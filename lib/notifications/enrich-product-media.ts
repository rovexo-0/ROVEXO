import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import type { Notification } from "@/lib/notifications/types";

/**
 * Spring 2 — if a commerce notification lacks product image / title,
 * resolve from order / listing href so Inbox never shows initials.
 */
export async function enrichNotificationProductMedia(
  notifications: Notification[],
): Promise<Notification[]> {
  if (!notifications.length) return notifications;

  const needs = notifications.filter(
    (item) =>
      item.type !== "system" &&
      item.type !== "moderation" &&
      (!isRenderableImageSrc(item.avatarUrl) || !item.avatarName?.trim()),
  );
  if (!needs.length) return notifications;

  const admin = tryCreateAdminClient();
  const supabase = admin ?? (await createClient());

  const orderIds = new Set<string>();
  const listingSlugs = new Set<string>();

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
  }

  const orderImageById = new Map<string, { title: string; imageUrl: string }>();
  const listingImageBySlug = new Map<string, { title: string; imageUrl: string }>();

  if (orderIds.size) {
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, title, image_url, slug")
      .in("order_id", [...orderIds]);
    for (const row of items ?? []) {
      if (!orderImageById.has(row.order_id)) {
        orderImageById.set(row.order_id, {
          title: row.title?.trim() || "",
          imageUrl: row.image_url?.trim() || "",
        });
      }
      if (row.slug) {
        listingSlugs.add(row.slug);
      }
    }
  }

  if (listingSlugs.size) {
    const { data: products } = await supabase
      .from("products")
      .select("slug, title, product_images ( url, is_primary, sort_order )")
      .in("slug", [...listingSlugs]);
    for (const product of products ?? []) {
      const images = (
        product as {
          product_images?: Array<{
            url: string;
            is_primary: boolean | null;
            sort_order: number | null;
          }>;
        }
      ).product_images;
      const imageUrl =
        [...(images ?? [])].sort(
          (a, b) =>
            Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0),
        )[0]?.url ?? "";
      listingImageBySlug.set(product.slug, {
        title: product.title?.trim() || "",
        imageUrl,
      });
    }
  }

  return notifications.map((item) => {
    if (isRenderableImageSrc(item.avatarUrl) && item.avatarName?.trim()) {
      return item;
    }

    const orderFromQuery = item.href.match(/[?&]order=([^&#]+)/);
    const orderMatch = item.href.match(/\/orders\/([^/?#]+)/);
    const orderId =
      (orderFromQuery?.[1] ? decodeURIComponent(orderFromQuery[1]) : undefined) ||
      (orderMatch?.[1] && orderMatch[1] !== "tracking" ? orderMatch[1] : undefined);
    const orderMeta = orderId ? orderImageById.get(orderId) : undefined;
    const listingMatch =
      item.href.match(/\/listing\/([^/?#]+)/) ?? item.href.match(/\/checkout\/([^/?#]+)/);
    const listingMeta = listingMatch?.[1]
      ? listingImageBySlug.get(decodeURIComponent(listingMatch[1]))
      : undefined;

    const title = item.avatarName?.trim() || orderMeta?.title || listingMeta?.title || "";
    const imageUrl =
      (isRenderableImageSrc(item.avatarUrl) ? item.avatarUrl : "") ||
      orderMeta?.imageUrl ||
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
