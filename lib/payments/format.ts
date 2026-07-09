import type { SavedPaymentMethod } from "@/lib/payments/repository";

export function formatSavedCardDetail(method: Pick<SavedPaymentMethod, "brand" | "last4">): string {
  const brand = method.brand.trim() || "Card";
  const label = brand.charAt(0).toUpperCase() + brand.slice(1);
  return `${label} ending ${method.last4}`;
}

export function formatSavedCardMask(method: Pick<SavedPaymentMethod, "last4">): string {
  return `**** **** **** ${method.last4}`;
}
