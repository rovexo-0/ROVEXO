/**
 * ROVEXO Public Identity v1.0 — username only on public marketplace surfaces.
 *
 * PUBLIC: username · avatar · rating · badges · reputation
 * PRIVATE: full name · address · contact · shipping · HMRC · financial
 *
 * Forbidden public fallbacks: fullName · firstName · lastName · email
 */

export const PUBLIC_IDENTITY_FALLBACKS = {
  seller: "Seller",
  member: "Member",
  store: "Store",
  buyer: "Buyer",
} as const;

/**
 * Resolve the public display label from username only.
 * Never accepts or falls back to full name / legal name / email.
 */
export function resolvePublicUsernameLabel(
  username: string | null | undefined,
  fallback: string = PUBLIC_IDENTITY_FALLBACKS.seller,
): string {
  const value = typeof username === "string" ? username.trim() : "";
  return value || fallback;
}

/** True when a string looks like an email (must never be a public identity label). */
export function looksLikeEmailIdentity(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.includes("@") && value.includes(".");
}
