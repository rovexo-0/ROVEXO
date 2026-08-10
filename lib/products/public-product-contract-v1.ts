/**
 * Public product document contract — anonymous SSR / CDN / catalogue surfaces.
 *
 * - sellerEmail must never serialize into public documents
 * - public seller identity = username only (never full name fallback)
 *
 * Reuse at every public document boundary. Do not invent a second system.
 */

import {
  PUBLIC_IDENTITY_FALLBACKS,
  resolvePublicUsernameLabel,
} from "@/lib/profile/public-display-name-v1";

export function redactSellerEmailForPublicDocument<T extends { sellerEmail?: string | null }>(
  product: T,
): T {
  if (!Object.prototype.hasOwnProperty.call(product, "sellerEmail")) {
    return product;
  }
  const { sellerEmail: _omit, ...rest } = product;
  return rest as T;
}

export function redactSellerEmailForPublicDocuments<T extends { sellerEmail?: string | null }>(
  products: T[],
): T[] {
  return products.map(redactSellerEmailForPublicDocument);
}

type PublicSellerFields = {
  sellerName?: string;
  sellerUsername?: string | null;
  sellerEmail?: string | null;
  fullName?: string | null;
};

/**
 * Public catalogue document: omit sellerEmail / fullName; sellerName = username only.
 */
export function toPublicProductDocument<T extends PublicSellerFields>(product: T): T {
  const withoutEmail = redactSellerEmailForPublicDocument(product);
  const username =
    typeof withoutEmail.sellerUsername === "string" ? withoutEmail.sellerUsername.trim() : "";
  const next: PublicSellerFields = {
    ...withoutEmail,
    sellerUsername: username || null,
    sellerName: resolvePublicUsernameLabel(username || null, PUBLIC_IDENTITY_FALLBACKS.seller),
  };
  if (Object.prototype.hasOwnProperty.call(next, "fullName")) {
    const { fullName: _omitFullName, ...rest } = next;
    return rest as T;
  }
  return next as T;
}

export function toPublicProductDocuments<T extends PublicSellerFields>(products: T[]): T[] {
  return products.map(toPublicProductDocument);
}
