/**
 * ROVEXO Settings module — freeze markers v1.0
 * STATUS = FROZEN when SETTINGS_CANONICAL_FROZEN === true.
 */

/** Canonical freeze label — Settings hub v1.0 approved production SSOT. */
export const SETTINGS_STATUS = "CANONICAL_FROZEN_v1.0" as const;

export const SETTINGS_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — Settings hub v1.0 approved production SSOT. */
export const SETTINGS_CANONICAL_STATUS = SETTINGS_STATUS;
export const SETTINGS_CANONICAL_FROZEN = true as const;

/** Alias for audits / docs. */
export const SETTINGS_UI_FREEZE = SETTINGS_STATUS;

export const SETTINGS_ROUTES = {
  hub: "/account/settings",
  about: "/account/settings/about",
} as const;

/** DOM markers locked at freeze. */
export const SETTINGS_FREEZE_DOM = {
  canonical: "v1.0",
} as const;

/** Frozen hub surfaces. */
export const SETTINGS_CANONICAL_COMPONENTS = [
  "SettingsV1",
  "SettingsMenuSections",
  "DeleteAccountFlow",
  "SettingsMenuIconGlyph",
  "AccountCanonicalShell",
] as const;

/** Frozen section titles in render order (excl. DANGER ZONE). */
export const SETTINGS_SECTION_TITLES = [
  "ACCOUNT",
  "SECURITY",
  "MARKETPLACE",
  "PREFERENCES",
  "LEGAL",
] as const;

/**
 * Frozen menu row titles in render order (from `buildSettingsMenuSections`).
 * Sign Out / Delete Account live in DANGER ZONE outside the SSOT menu builder.
 */
export const SETTINGS_MENU_ROW_TITLES = [
  "Profile",
  "Addresses",
  "Payment Methods",
  "Notifications",
  "ROVEXO Ideas",
  "Privacy & Security",
  "Connected Accounts",
  "Devices & Sessions",
  "Blocked Users",
  "Business Verification",
  "Seller Performance",
  "Promotion Tools",
  "Wallet",
  "Preferences",
  "Language & Currency",
  "Accessibility",
  "Terms & Policies",
  "About ROVEXO",
] as const;

/** Frozen danger-zone actions (render after LEGAL). */
export const SETTINGS_DANGER_ACTIONS = ["Sign Out", "Delete Account"] as const;

/** Full approved inventory including danger zone. */
export const SETTINGS_APPROVED_INVENTORY = [
  ...SETTINGS_MENU_ROW_TITLES,
  ...SETTINGS_DANGER_ACTIONS,
] as const;
