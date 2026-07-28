/**
 * ROVEXO PROFILE MASTER TOKENS v1.0
 *
 * EXTRACTED from Profile page CSS — DO NOT invent values.
 * Sources (SSOT):
 * - styles/rovexo/account-canonical-v2.css  (.ac-canonical__menu · .ac-canonical__avatar)
 * - styles/rovexo/full-width-engine-v1.css  (:root --fw-*)
 *
 * Personal Information / Settings / future My Account pages MUST inherit these.
 * Forbidden: guessing px · forking typography · alternate row heights.
 */

/** Profile menu row — `.ac-canonical__menu .cds-menu-row` */
export const PROFILE_MASTER_ROW = {
  minHeightPx: 56,
  paddingInlinePx: 0,
  fontSizePx: 16,
  fontWeight: 400,
  border: "none",
  background: "transparent",
  transition: "none",
} as const;

/** Profile menu title — `.ac-canonical__menu .cds-menu-row__title` */
export const PROFILE_MASTER_TITLE = {
  fontSizePx: 16,
  fontWeight: 400,
  color: "#1a1a1a",
  lineHeight: 1.25,
} as const;

/**
 * Profile / Settings subtitle · value line
 * `.cds-menu-row__subtitle` + Full Width `--fw-small-size`
 */
export const PROFILE_MASTER_SUBTITLE = {
  fontSizePx: 14,
  fontWeight: 400,
  color: "#64748b",
  lineHeight: 1.25,
} as const;

/** Profile menu icon — `.ac-canonical__menu .cds-menu-row__icon` */
export const PROFILE_MASTER_ICON = {
  sizePx: 24,
} as const;

/** Profile menu chevron — `.ac-canonical__menu .cds-menu-row__chevron svg` */
export const PROFILE_MASTER_CHEVRON = {
  sizePx: 16,
  color: "#1a1a1a",
} as const;

/** Profile avatar — `.ac-canonical__avatar` */
export const PROFILE_MASTER_AVATAR = {
  sizePx: 64,
  borderRadius: "999px",
  background: "#f5f5f5",
} as const;

/** Profile identity header — `.ac-canonical__identity--full` */
export const PROFILE_MASTER_HEADER_IDENTITY = {
  minHeightPx: 64,
  paddingBlockPx: 8,
  gapPx: 12,
} as const;

/** Profile hub stack — `.ac-canonical` */
export const PROFILE_MASTER_HUB = {
  gapPx: 12,
  paddingPx: 0,
  background: "#ffffff",
  width: "100%",
} as const;

/** Full Width Engine — Profile reference (`full-width-engine-v1.css` · Design Decision #001) */
export const PROFILE_MASTER_FULL_WIDTH = {
  width: "100%",
  paddingPx: 16,
  rowMinHeightPx: 56,
  headerHeightPx: 64,
  pageTitlePx: 32,
  sectionTitlePx: 24,
  bodyPx: 16,
  smallPx: 14,
  componentGapPx: 24,
  sectionGapPx: 24,
  buttonHeightPx: 56,
  buttonRadiusPx: 16,
  inputHeightPx: 56,
  touchTargetMinPx: 44,
  chevronSizePx: 16,
  chevronColor: "#1a1a1a",
  titleColor: "#1a1a1a",
  background: "#ffffff",
} as const;

/** Click / touch — Profile + Full Width rows */
export const PROFILE_MASTER_CLICK = {
  rowMinHeightPx: 56,
  touchMinHeightPx: 44,
} as const;

export const PROFILE_MASTER_TOKENS_STATUS = "PERMANENT LOCK · EXTRACTED FROM PROFILE" as const;

export function profileMasterTokensSnapshot() {
  return {
    status: PROFILE_MASTER_TOKENS_STATUS,
    source: [
      "styles/rovexo/account-canonical-v2.css",
      "styles/rovexo/full-width-engine-v1.css",
    ] as const,
    row: PROFILE_MASTER_ROW,
    title: PROFILE_MASTER_TITLE,
    subtitle: PROFILE_MASTER_SUBTITLE,
    icon: PROFILE_MASTER_ICON,
    chevron: PROFILE_MASTER_CHEVRON,
    avatar: PROFILE_MASTER_AVATAR,
    headerIdentity: PROFILE_MASTER_HEADER_IDENTITY,
    hub: PROFILE_MASTER_HUB,
    fullWidth: PROFILE_MASTER_FULL_WIDTH,
    click: PROFILE_MASTER_CLICK,
    goldenRule: "ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.",
  } as const;
}
