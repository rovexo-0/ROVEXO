/**
 * Promote payment display helpers (client-safe).
 */

export function formatDefaultCardLabel(card: { brand: string; last4: string }): string {
  const normalized = card.brand.trim().toLowerCase();
  const brand = normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "Card";
  return `${brand} •••• ${card.last4}`;
}
