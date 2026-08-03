/**
 * ROVEXO Listing Attribute Label — typography SSOT (Attribute Engine v1.0).
 * Left-side attribute labels on Sell / Edit / View Item.
 */
export const LISTING_ATTRIBUTE_LABEL_V1 = {
  version: "1.0",
  status: "OWNER_CERTIFIED_UI_LOCK",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontWeight: 500,
  fontSizePx: 16,
  lineHeightPx: 24,
  letterSpacing: "0",
  color: "#111111",
  textAlign: "left" as const,
  /** Optional lower opacity for "(recommended)" only — same metrics. */
  recommendedSuffixOpacity: 0.55,
} as const;
