import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";

type AdminClient = SupabaseClient<Database>;

export type ListingNotificationPurgeTarget = {
  id: string;
  slug: string;
};

/**
 * Removes in-app notifications that deep-link to a listing being deleted.
 * Notifications have no product_id FK — href is the only join — so this runs
 * before the product row is hard-deleted. Offer and conversation rows still
 * exist at purge time so their IDs can be matched in inbox/checkout hrefs.
 */
export async function purgeListingNotifications(
  admin: AdminClient,
  target: ListingNotificationPurgeTarget,
): Promise<void> {
  const hrefDeletes = [
    admin.from("notifications").delete().like("href", `%/listing/${target.slug}%`),
    admin.from("notifications").delete().like("href", `%/checkout/${target.slug}%`),
    admin.from("notifications").delete().like("href", `%highlight=${target.id}%`),
  ];

  const [{ data: offers }, { data: conversations }] = await Promise.all([
    admin.from("offers").select("id").eq("product_id", target.id),
    admin.from("conversations").select("id").eq("product_id", target.id),
  ]);

  for (const offer of offers ?? []) {
    const encoded = encodeURIComponent(offer.id);
    hrefDeletes.push(
      admin.from("notifications").delete().like("href", `%offer=${encoded}%`),
      admin.from("notifications").delete().like("href", `%offerId=${encoded}%`),
    );
  }

  for (const conversation of conversations ?? []) {
    hrefDeletes.push(
      admin
        .from("notifications")
        .delete()
        .like("href", `%/inbox/conversation/${conversation.id}%`),
    );
  }

  await Promise.all(hrefDeletes);
}
