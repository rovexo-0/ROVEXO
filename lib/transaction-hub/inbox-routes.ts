/** Canonical Transaction Hub inbox — Sprint 1: `/inbox`. */

import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";

export const TRANSACTION_HUB_INBOX_PATH = INBOX_ROUTES.hub;

export function transactionHubInboxHref(conversationId?: string): string {
  if (conversationId?.trim()) {
    return INBOX_ROUTES.conversation(conversationId.trim());
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
