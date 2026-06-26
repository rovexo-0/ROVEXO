/**
 * Features explicitly excluded from ROVEXO Beta v1.0.
 * Listed here for product planning — not implemented during Beta.
 */

export const POST_BETA_FEATURES = [
  "AI Scan",
  "Voice Search",
  "AI Translation",
  "AI Auto Reply",
  "Price History",
  "Demand Score",
  "Trending AI",
  "Fake Detection",
  "SEO AI",
  "Live Views",
] as const;

export type PostBetaFeature = (typeof POST_BETA_FEATURES)[number];
