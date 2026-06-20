/**
 * Features explicitly excluded from ROVEXO Beta v1.0.
 * Do not implement these during Beta. Leave TODO comments only.
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

// TODO(post-beta): AI Scan — identify products from a camera scan feed.
// TODO(post-beta): Voice Search — microphone input for search queries.
// TODO(post-beta): AI Translation — auto-translate listing copy and messages.
// TODO(post-beta): AI Auto Reply — automated seller message responses.
// TODO(post-beta): Price History — historical price charts for listings.
// TODO(post-beta): Demand Score — predictive demand scoring for sellers.
// TODO(post-beta): Trending AI — AI-curated trending recommendations.
// TODO(post-beta): Fake Detection — authenticity scoring for high-risk items.
// TODO(post-beta): SEO AI — automated listing SEO optimization.
// TODO(post-beta): Live Views — real-time concurrent viewer counts.
