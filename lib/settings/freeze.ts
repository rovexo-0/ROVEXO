/**
 * ROVEXO Settings module — freeze markers v1.0 + Phase C.3 Account Control Centre.
 * Design lock unchanged. Content inventory expanded under Phase C.3.
 */

/** Canonical freeze label — Settings hub v1.0 permanent design lock. */
export const SETTINGS_STATUS = "PERMANENT_LOCK_v1.0_APPROVED" as const;

export const SETTINGS_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — Settings hub v1.0 approved production SSOT. */
export const SETTINGS_CANONICAL_STATUS = SETTINGS_STATUS;
export const SETTINGS_CANONICAL_FROZEN = true as const;

/** Alias for audits / docs. */
export const SETTINGS_UI_FREEZE = SETTINGS_STATUS;

export const SETTINGS_ROUTES = {
  hub: "/account/settings",
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

/** UK Public Launch Simplification v1.0 section titles (excl. DANGER ZONE). */
export const SETTINGS_SECTION_TITLES = [
  "ACCOUNT",
  "SUPPORT",
  "LEGAL",
] as const;

/**
 * UK Public Launch menu row titles in render order (from `buildSettingsMenuSections`).
 * Delete Account lives in DANGER ZONE. Sign Out lives on Profile only.
 * Verification / Marketplace / Finance / Report / Feedback = navigation removed only.
 * About ROVEXO removed — version metadata stays internal (lib/app/version.ts).
 */
export const SETTINGS_MENU_ROW_TITLES = [
  "Personal Information",
  "Security",
  "Privacy",
  "Notifications",
  "Addresses",
  "Payment Methods",
  "Currency & Region",
  "Blocked Users",
  "Help Centre",
  "Legal Information",
  "HMRC Reporting",
] as const;

/** Frozen danger-zone actions (render after LEGAL). */
export const SETTINGS_DANGER_ACTIONS = ["Delete Account"] as const;

/** Full approved inventory including danger zone. */
export const SETTINGS_APPROVED_INVENTORY = [
  ...SETTINGS_MENU_ROW_TITLES,
  ...SETTINGS_DANGER_ACTIONS,
] as const;
