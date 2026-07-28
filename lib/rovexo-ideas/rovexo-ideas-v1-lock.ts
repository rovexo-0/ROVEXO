/**
 * Rovexo Ideas FINAL IMPLEMENTATION LOCK v1.0
 * ONE TIME IMPLEMENTATION ONLY · PERMANENTLY LOCKED
 *
 * PROFILE + SETTINGS + FULL WIDTH + golden lightbulb + "Rovexo Ideas" = FINAL
 * No second design system. No custom row values. Icon + text may differ only.
 */

export const ROVEXO_IDEAS_NAME = "Rovexo Ideas" as const;
export const ROVEXO_IDEAS_VERSION = "1.0" as const;
export const ROVEXO_IDEAS_STATUS = "PERMANENTLY LOCKED" as const;
export const ROVEXO_IDEAS_DOM = "v1.0-ideas-lock" as const;
export const ROVEXO_IDEAS_ROUTE = "/account/ideas" as const;
export const ROVEXO_IDEAS_MENU_ID = "ideas" as const;
/** Official menu label — only allowed spelling. */
export const ROVEXO_IDEAS_MENU_TITLE = "Rovexo Ideas" as const;

/** Forbidden naming variations (user-facing). */
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
  /** Only icon + text may differ from Settings / Help Centre rows. */
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

export const ROVEXO_IDEAS_FORBIDDEN = [
  "cards",
  "banners",
  "dashboards",
  "statistics pages",
  "second design systems",
  "duplicate menu entries",
  "custom typography",
  "custom row height",
  "custom chevron colour",
  "custom paddings",
  "mandatory categories",
  "mandatory templates",
  "forced questionnaires",
  "promises of implementation",
  "release date commitments",
  "70%",
  "80%",
  "85%",
  "90%",
  "95%",
  "centred layouts",
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
    goldenRule:
      "PROFILE + SETTINGS + FULL WIDTH + MINIMALISTIC GOLDEN YELLOW LIGHTBULB + Rovexo Ideas = FINAL",
  } as const;
}
