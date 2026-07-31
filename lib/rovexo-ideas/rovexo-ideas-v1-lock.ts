/**
 * Rovexo Ideas FINAL IMPLEMENTATION LOCK v1.0
 * Owner mockups (Empty + Community) = canonical UI SSOT.
 * PROFILE menu row unchanged · page surface = community Ideas Hub.
 */

export const ROVEXO_IDEAS_NAME = "Rovexo Ideas" as const;
export const ROVEXO_IDEAS_VERSION = "1.0" as const;
export const ROVEXO_IDEAS_STATUS = "PERMANENTLY LOCKED" as const;
export const ROVEXO_IDEAS_DOM = "v1.0-ideas-community" as const;
export const ROVEXO_IDEAS_ROUTE = "/account/ideas" as const;
export const ROVEXO_IDEAS_MENU_ID = "ideas" as const;
/** Official menu label — only allowed spelling. */
export const ROVEXO_IDEAS_MENU_TITLE = "Rovexo Ideas" as const;

/** CTA label — Owner mockup override (not "Submit Idea"). */
export const ROVEXO_IDEAS_SHARE_CTA = "Share Your Idea" as const;

export const ROVEXO_IDEAS_HERO = {
  titlePrefix: "Rovexo",
  titleAccent: "Ideas",
  subtitle:
    "Share your ideas, vote for what matters and help shape the future of Rovexo.",
  cta: ROVEXO_IDEAS_SHARE_CTA,
  bearSrc: "/ideas/rx-bear-hero.png",
  emptyBearSrc: "/ideas/rx-bear-empty.png",
} as const;

export const ROVEXO_IDEAS_EMPTY_COPY = {
  title: "Hmm... we're waiting for your ideas!",
  body: "Looks like no one has shared an idea yet. Be the first to spark a new one and help make Rovexo even better.",
} as const;

/** Empty State shows only these chrome layers (Owner UI Lock). */
export const ROVEXO_IDEAS_EMPTY_SHOWS = [
  "hero",
  "stats",
  "filters",
  "empty-bear",
  "bottom-nav",
  "share-sheet",
] as const;

/** Completely unmounted while ideas.length === 0 (no reserved space). */
export const ROVEXO_IDEAS_EMPTY_HIDES = [
  "search",
  "idea-list",
  "idea-cards",
  "like-dislike",
  "community-score",
  "follow",
  "share",
  "comments",
  "developer-timeline",
] as const;

export const ROVEXO_IDEAS_FORBIDDEN_NAMES = [
  "ROVEXO IDEAS",
  "ROVEXO Ideas",
  "ROVEXO IDEAS V1",
  "ROVEXO Ideas V1",
] as const;

export const ROVEXO_IDEAS_PROFILE_MENU_ORDER = [
  "Settings",
  "Rovexo Ideas",
  "Help Centre",
  "Legal Information",
] as const;

export const ROVEXO_IDEAS_MENU_ROW = {
  icon: true,
  title: ROVEXO_IDEAS_MENU_TITLE,
  chevron: true,
  subtitle: false,
  badge: false,
  card: false,
  identicalToSiblingRowsExcept: ["icon", "text"] as const,
} as const;

/** Minimalist lightbulb — Profile icon slot (24px). Soft golden yellow. */
export const ROVEXO_IDEAS_ICON = {
  kind: "lightbulb" as const,
  sizePx: 24,
  color: "#FFD54A",
  style: ["minimalist", "premium", "elegant", "lightweight", "modern"] as const,
  forbidden: ["circle", "purple", "emoji", "gradient", "complex"] as const,
} as const;

export const ROVEXO_IDEAS_INHERITS_FROM = [
  "Profile page",
  "Settings page",
  "Profile design system",
  "Promote",
  "Holiday Mode",
  "Help Centre",
  "My Orders",
  "Full Width Contract",
] as const;

export const ROVEXO_IDEAS_CHARACTER = [
  "community driven",
  "minimalist",
  "premium",
  "unrestricted",
] as const;

export const ROVEXO_IDEAS_USER_MAY = [
  "submit ideas",
  "vote",
  "comment",
  "follow ideas",
  "search ideas",
  "discuss ideas",
  "share ideas",
] as const;

/** Profile menu row still forbids custom row chrome. Page surface may use Owner mockup cards. */
export const ROVEXO_IDEAS_FORBIDDEN = [
  "second design systems",
  "duplicate menu entries",
  "custom row height",
  "custom chevron colour",
  "custom paddings on Profile menu row",
  "mandatory templates",
  "forced questionnaires",
  "promises of implementation",
  "release date commitments",
  "70%",
  "80%",
  "85%",
  "90%",
  "95%",
  "secondary pages",
  "modal windows",
] as const;

export const ROVEXO_IDEAS_FILTERS = [
  "top",
  "latest",
  "under_review",
  "planned",
  "released",
  "declined",
] as const;

export const ROVEXO_IDEAS_STATS = [
  "submitted",
  "under_review",
  "planned",
  "in_development",
  "released",
] as const;

export const ROVEXO_IDEAS_CATEGORIES = [
  "Buying",
  "Selling",
  "Payments",
  "Shipping",
  "Account",
  "Search",
  "Other",
] as const;

export const ROVEXO_IDEAS_PLATFORM_DECIDES = [
  "prioritisation",
  "implementation",
  "releases",
  "future development",
] as const;

export const ROVEXO_IDEAS_LOCKS = {
  permanent: true,
  oneTimeImplementationOnly: true,
  profileMenuOnly: true,
  inheritsProfile100: true,
  inheritsSettings100: true,
  noSecondDesignSystem: true,
  noCustomRowValues: true,
  noDuplicateMenuEntries: true,
  singlePageOnly: true,
  noModals: true,
  ownerMockupSsot: true,
  officialNameOnly: ROVEXO_IDEAS_MENU_TITLE,
  rovexoFinalDecision: true,
} as const;

export function rovexoIdeasV1Snapshot() {
  return {
    name: ROVEXO_IDEAS_NAME,
    version: ROVEXO_IDEAS_VERSION,
    status: ROVEXO_IDEAS_STATUS,
    dom: ROVEXO_IDEAS_DOM,
    route: ROVEXO_IDEAS_ROUTE,
    menuOrder: [...ROVEXO_IDEAS_PROFILE_MENU_ORDER],
    menuRow: ROVEXO_IDEAS_MENU_ROW,
    icon: ROVEXO_IDEAS_ICON,
    inherits: [...ROVEXO_IDEAS_INHERITS_FROM],
    character: [...ROVEXO_IDEAS_CHARACTER],
    userMay: [...ROVEXO_IDEAS_USER_MAY],
    forbidden: [...ROVEXO_IDEAS_FORBIDDEN],
    forbiddenNames: [...ROVEXO_IDEAS_FORBIDDEN_NAMES],
    platformDecides: [...ROVEXO_IDEAS_PLATFORM_DECIDES],
    locks: ROVEXO_IDEAS_LOCKS,
    hero: ROVEXO_IDEAS_HERO,
    emptyCopy: ROVEXO_IDEAS_EMPTY_COPY,
    emptyShows: [...ROVEXO_IDEAS_EMPTY_SHOWS],
    emptyHides: [...ROVEXO_IDEAS_EMPTY_HIDES],
    shareCta: ROVEXO_IDEAS_SHARE_CTA,
    filters: [...ROVEXO_IDEAS_FILTERS],
    stats: [...ROVEXO_IDEAS_STATS],
    categories: [...ROVEXO_IDEAS_CATEGORIES],
    goldenRule:
      "ideas.length === 0 → Empty (mascot+waiting+description); ideas.length > 0 → list only; Share Your Idea in hero; filters/stats preserved",
  } as const;
}
