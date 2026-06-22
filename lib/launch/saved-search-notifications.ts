import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export type SavedSearchNotificationResult = {
  searchesProcessed: number;
  notificationsSent: number;
};

export async function processSavedSearchNotifications(
  lookbackHours = 24,
): Promise<SavedSearchNotificationResult> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const { data: searches } = await admin
    .from("saved_searches")
    .select("id, user_id, query, filters, last_notified_at")
    .eq("notify_enabled", true)
    .limit(500);

  if (!searches?.length) {
    return { searchesProcessed: 0, notificationsSent: 0 };
  }

  const { data: products } = await admin
    .from("products")
    .select("id, slug, title, created_at")
    .eq("status", "published")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!products?.length) {
    return { searchesProcessed: searches.length, notificationsSent: 0 };
  }

  let notificationsSent = 0;

  for (const search of searches) {
    const query = String(search.query).trim().toLowerCase();
    if (!query) continue;

    const matches = products.filter((product) =>
      String(product.title).toLowerCase().includes(query),
    );

    for (const product of matches.slice(0, 3)) {
      const { data: existing } = await admin
        .from("saved_search_notification_log")
        .select("id")
        .eq("saved_search_id", search.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) continue;

      await dispatchNotification({
        userId: String(search.user_id),
        type: "saved_search_match",
        title: "New listing for your saved search",
        subtitle: `"${product.title}" matches "${search.query}"`,
        href: `/listing/${product.slug}`,
        detail: search.query,
      });

      await admin.from("saved_search_notification_log").insert({
        saved_search_id: search.id,
        product_id: product.id,
      });

      notificationsSent += 1;
    }

    if (matches.length > 0) {
      await admin
        .from("saved_searches")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", search.id);
    }
  }

  return { searchesProcessed: searches.length, notificationsSent };
}
