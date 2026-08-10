/**
 * ROVEXO Make Offer — Cod Sânge v1.0 FINAL FREEZE
 * STATUS: OWNER APPROVED · FROZEN
 *
 * Close · Image · Title · £price · 5% · 10% · Custom · £input · Submit Offer
 * Owner (2026-08-10): offer quota / "offers left" subtext removed from UI render.
 */

export const MAKE_OFFER_FREEZE_V1 = {
  version: "make-offer-v1",
  status: "FINAL_FREEZE",
  ownerApproved: true,
  freezeLocked: true,
  /** Server/rate-limit reference only — never render as user-facing quota copy. */
  dailyOfferLimit: 25,
  showOfferQuotaSubtext: false,
  presets: [
    { id: "off5", label: "5% off", discount: 0.05 },
    { id: "off10", label: "10% off", discount: 0.1 },
    { id: "custom", label: "Custom" },
  ] as const,
  removedForever: [
    "Make Offer title",
    "Item price label",
    "Listing price title",
    "Your offer (£)",
    "Message (optional)",
    "Add a note for seller",
    "Cancel button",
    "Buyer Protection fee",
    "Learn why",
    "offers left for today",
    "X offers left for today",
    "offers remaining",
    "offer quota subtext",
  ] as const,
  stack: [
    "Close",
    "Product image",
    "Product title",
    "£XX.XX",
    "5% OFF",
    "10% OFF",
    "CUSTOM",
    "£0.00",
    "Submit Offer",
  ] as const,
} as const;

export function calculateOfferFromDiscount(listingPrice: number, discount: number): number {
  const raw = listingPrice * (1 - discount);
  return Math.round(raw * 100) / 100;
}

export function formatOfferAmount(amount: number): string {
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Allow only digits + optional decimal (max 2 places). */
export function sanitizeOfferInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("").slice(0, 2)}`;
}

export function parseOfferAmount(raw: string): number | null {
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}
