/**
 * ROVEXO Listing Attribute Value — typography SSOT (Attribute Engine v1.0).
 * Owner UI LOCK: every Sell / Edit / View Item attribute value uses this once.
 */
export const LISTING_ATTRIBUTE_VALUE_V1 = {
  version: "1.0",
  status: "OWNER_CERTIFIED_UI_LOCK",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontWeight: 500,
  fontSizePx: 16,
  lineHeightPx: 24,
  letterSpacing: "0",
  color: "#111111",
  textAlign: "right" as const,
} as const;
