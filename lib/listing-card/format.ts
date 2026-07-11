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
  const n = views ?? 0;
  if (n >= 10_000) return "10K+";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function formatCardRating(product: { rating: number; reviewCount?: number }): string {
  const r = product.rating;
  if (!Number.isFinite(r) || r <= 0) return "—";
  return r.toFixed(1);
}

export function formatReviewCount(count?: number): string | null {
  if (!count || count <= 0) return null;
  return `(${count.toLocaleString("en-GB")})`;
}
