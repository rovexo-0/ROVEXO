import { calculatePlatformFee } from "@/lib/orders/pricing";

export function formatListingPrice(amount: number): string {
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatListingPriceIncl(amount: number): string {
  const fee = calculatePlatformFee(amount);
  const total = Math.round((amount + fee) * 100) / 100;
  return `${formatListingPrice(total)} incl.`;
}

/** Homepage listing card — buyer-facing Platform Fee line only. */
export function formatPlatformFeeLine(itemPrice: number): string {
  return `${formatListingPrice(calculatePlatformFee(itemPrice))} Platform Fee`;
}

export function humanizeListingCondition(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const text = raw.replace(/[_-]+/g, " ").trim();
  if (!text || text.toLowerCase() === "unknown") return null;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatCardViews(views?: number): string {
  const n = Math.max(0, Math.floor(views ?? 0));
  if (n < 1000) return String(n);

  if (n < 1_000_000) {
    const thousands = n / 1000;
    if (Number.isInteger(thousands)) return `${thousands}K`;
    const oneDecimal = Math.round(thousands * 10) / 10;
    if (Number.isInteger(oneDecimal)) return `${oneDecimal}K`;
    return `${oneDecimal.toFixed(1)}K`;
  }

  const millions = n / 1_000_000;
  if (Number.isInteger(millions)) return `${millions}M`;
  const oneDecimal = Math.round(millions * 10) / 10;
  if (Number.isInteger(oneDecimal)) return `${oneDecimal}M`;
  return `${oneDecimal.toFixed(1)}M`;
}

/** Product / Owner UI label — "1 View" · "12 Views" · "1.1K Views" · "1.2M Views". */
export function formatProductViewsLabel(views?: number): string {
  const n = Math.max(0, Math.floor(views ?? 0));
  const amount = formatCardViews(n);
  return n === 1 ? `${amount} View` : `${amount} Views`;
}

/** Always a numeric rating for Product Card v1.0 — new products show 0.0. */
export function formatCardRating(product: { rating: number; reviewCount?: number }): string {
  const r = product.rating;
  if (!Number.isFinite(r) || r <= 0) return "0.0";
  return r.toFixed(1);
}

export function formatReviewCount(count?: number): string | null {
  if (!count || count <= 0) return null;
  return `(${count.toLocaleString("en-GB")})`;
}
