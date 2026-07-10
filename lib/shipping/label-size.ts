/** Seller default label format — stored per seller in shipping settings. */
export const SELLER_LABEL_SIZES = ["thermal_4x6", "a4_pdf"] as const;

export type SellerDefaultLabelSize = (typeof SELLER_LABEL_SIZES)[number];

/** 100 × 150 mm (4×6) thermal — platform default for every seller. */
export const DEFAULT_SELLER_LABEL_SIZE: SellerDefaultLabelSize = "thermal_4x6";

export const SELLER_LABEL_SIZE_LABELS: Record<SellerDefaultLabelSize, string> = {
  thermal_4x6: "4×6 Thermal (100 × 150 mm)",
  a4_pdf: "A4 PDF",
};

export function isSellerDefaultLabelSize(value: unknown): value is SellerDefaultLabelSize {
  return typeof value === "string" && (SELLER_LABEL_SIZES as readonly string[]).includes(value);
}

export function resolveSellerDefaultLabelSize(value: unknown): SellerDefaultLabelSize {
  return isSellerDefaultLabelSize(value) ? value : DEFAULT_SELLER_LABEL_SIZE;
}
