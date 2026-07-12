/** Canonical Transaction Hub inbox routes — `/messages` is the live inbox. */

export const TRANSACTION_HUB_INBOX_PATH = "/messages" as const;

export function transactionHubInboxHref(conversationId?: string): string {
  if (conversationId?.trim()) {
    return `${TRANSACTION_HUB_INBOX_PATH}/${conversationId.trim()}`;
  }
  return TRANSACTION_HUB_INBOX_PATH;
}

export function transactionHubCheckoutHref(
  productSlug: string,
  conversationId?: string,
): string {
  const base = `/checkout/${productSlug}`;
  if (!conversationId?.trim()) return base;
  const returnTo = encodeURIComponent(transactionHubInboxHref(conversationId));
  return `${base}?returnTo=${returnTo}&hub=chat`;
}

export function transactionHubListingHref(slug: string): string {
  return `/listing/${slug}`;
}
