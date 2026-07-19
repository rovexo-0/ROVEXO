import { revalidatePath } from "next/cache";

/**
 * Bust ISR / RSC caches after a listing is published or updated so the new
 * listing appears immediately on every canonical surface — no restart, no
 * manual refresh, no delay. Seller store (`/user/[username]`), Messages, etc.
 * render dynamically (cookies) and are always fresh, so only the ISR/static
 * surfaces need explicit revalidation here.
 */
export function revalidatePublishedListing(slug?: string | null): void {
  // Homepage (revalidate=60) + shared layout.
  revalidatePath("/");
  revalidatePath("/", "layout");
  // My Listings.
  revalidatePath("/seller/listings");
  // My Account hub stats (listings counter).
  revalidatePath("/account");
  // Search results.
  revalidatePath("/search");
  // Category index + every nested category page (revalidate=300).
  revalidatePath("/categories");
  revalidatePath("/category/[...slug]", "page");
  // Browse + location landing trees.
  revalidatePath("/browse/[...segments]", "page");
  revalidatePath("/l/[location]", "page");
  revalidatePath("/l/[location]/[...category]", "page");
  revalidatePath("/brand/[slug]", "page");
  revalidatePath("/discover/[slug]", "page");
  revalidatePath("/collections/[slug]", "page");
  revalidatePath("/trends/[slug]", "page");

  if (slug) {
    revalidatePath(`/listing/${slug}`);
  }
}

/**
 * Rebuild every marketplace surface after a bulk mutation (e.g. Super Admin
 * "Delete All Listings"). Covers everything `revalidatePublishedListing` does
 * plus seller store trees so Homepage, Search, Categories and Seller Stores all
 * reflect the empty state immediately.
 */
export function revalidateMarketplaceListings(): void {
  revalidatePublishedListing();
  // Seller storefronts.
  revalidatePath("/user/[username]", "page");
  revalidatePath("/store/[slug]", "page");
}

/**
 * Bust caches after a listing is permanently deleted so it disappears from every
 * live surface immediately. Extends marketplace revalidation with user-private
 * routes that embed product refs (Saved, Cart, Inbox, Orders, Wallet, Notifications).
 * Order history keeps its snapshot rows — only live discovery surfaces rebuild.
 */
export function revalidateDeletedListing(slug?: string | null): void {
  revalidateMarketplaceListings();

  revalidatePath("/saved");
  revalidatePath("/cart");
  revalidatePath("/inbox");
  revalidatePath("/inbox/conversation/[conversationId]", "page");
  revalidatePath("/messages");
  revalidatePath("/messages/[id]", "page");
  revalidatePath("/orders");
  revalidatePath("/orders/[id]", "page");
  revalidatePath("/seller/orders");
  revalidatePath("/seller/orders/[id]", "page");
  revalidatePath("/account/orders");
  revalidatePath("/wallet");
  revalidatePath("/wallet/transactions");
  revalidatePath("/notifications");

  if (slug) {
    revalidatePath(`/listing/${slug}`);
    revalidatePath(`/checkout/${slug}`);
  }
}
