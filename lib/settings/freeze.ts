/**
 * ROVEXO Settings module — freeze markers v1.0
 * Master Engine lock: Settings inventory (no Holiday/Promote/Help/Legal/Sign Out/Payments/Bank).
 */

/** Canonical freeze label — Settings hub v1.0 permanent lock. */
export const SETTINGS_STATUS = "PERMANENT_LOCK_v1.0_APPROVED" as const;

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
  "MyAccountTemplate",
] as const;

/** Frozen section titles in render order (excl. DANGER ZONE). */
export const SETTINGS_SECTION_TITLES = ["ACCOUNT", "SECURITY", "PREFERENCES"] as const;

/**
 * Frozen menu row titles in render order (from `buildSettingsMenuSections`).
 * Delete Account lives in DANGER ZONE. Sign Out lives on Profile only.
 */
export const SETTINGS_MENU_ROW_TITLES = [
  "Personal Information",
  "Addresses",
  "Notifications",
  "Privacy",
  "Security",
  "Verification",
  "Currency",
] as const;

/** Frozen danger-zone actions (render after PREFERENCES). */
export const SETTINGS_DANGER_ACTIONS = ["Delete Account"] as const;

/** Full approved inventory including danger zone. */
export const SETTINGS_APPROVED_INVENTORY = [
  ...SETTINGS_MENU_ROW_TITLES,
  ...SETTINGS_DANGER_ACTIONS,
] as const;
