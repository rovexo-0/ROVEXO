import type { SavedPaymentMethod } from "@/lib/payments/repository";

export function formatSavedCardDetail(method: Pick<SavedPaymentMethod, "brand" | "last4">): string {
  const brand = method.brand.trim() || "Card";
  const label = brand.charAt(0).toUpperCase() + brand.slice(1);
  return `${label} ending ${method.last4}`;
}

/** Payment Methods v5.0 Owner mask — never invent PAN digits. */
export function formatSavedCardMask(method: Pick<SavedPaymentMethod, "last4">): string {
  return `**** **** **** ${method.last4}`;
}

export function formatSavedCardExpiry(
  method: Pick<SavedPaymentMethod, "expMonth" | "expYear">,
): string {
  const month = String(Math.max(1, Math.min(12, method.expMonth || 1))).padStart(2, "0");
  const year = method.expYear > 0 ? method.expYear : "----";
  return `Expires ${month}/${year}`;
}

export function formatPaymentBrandLabel(brand: string): string {
  const normalized = brand.trim().toLowerCase();
  if (normalized === "visa") return "Visa";
  if (normalized === "mastercard" || normalized === "master card") return "Mastercard";
  if (normalized === "amex" || normalized === "american express") return "Amex";
  if (!brand.trim()) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

/** Display title for Payment Methods rows (Owner visual: VISA / MasterCard). */
export function formatPaymentBrandTitle(brand: string): string {
  const label = formatPaymentBrandLabel(brand);
  if (label === "Visa") return "VISA";
  if (label === "Mastercard") return "MasterCard";
  return label.toUpperCase();
}
