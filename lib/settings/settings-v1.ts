/**
 * ROVEXO Settings v1.0 — PERMANENT LOCK · UI/UX APPROVED · PRODUCTION READY
 *
 * MASTER RULE: PROFILE PAGE = MASTER PAGE + SETTINGS v1.0
 * = PROFILE PAGE DESIGN + DIFFERENT CONTENT
 * ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.
 */

import type { LocaleCode } from "@/lib/i18n/config";

export const SETTINGS_V1_STATUS =
  "PERMANENT LOCK · UI/UX APPROVED · PRODUCTION READY" as const;
export const SETTINGS_V1_VERSION = "1.0" as const;
export const SETTINGS_V1_DOM = "v1.0" as const;

/** Owner Master Rule — Settings inherits Profile 100%. */
export const SETTINGS_V1_MASTER_RULE = {
  profileIsMasterPage: true,
  settingsEqualsProfileDesignPlusContent: true,
  onlyContentMayDiffer: true,
  designNeverDoes: true,
  inherits100Percent: [
    "Header",
    "Full Width",
    "Typography",
    "Padding",
    "Icon Family",
    "Colors",
    "Components",
    "Responsive behaviour",
    "Animations",
    "Loading States",
    "Skeleton States",
    "Section spacing",
    "Arrow component",
    "Divider component",
  ] as const,
  inheritanceChain: [
    "PROFILE PAGE",
    "MASTER PAGE",
    "MASTER TEMPLATE",
    "SETTINGS v1.0",
    "inherits 100%",
    "MY ACCOUNT v1.0",
  ] as const,
} as const;

/** Locked hub inventory (content SSOT). */
export const SETTINGS_V1_INVENTORY = {
  account: [
    { title: "Personal Information", subtitle: "Name, photo and username." },
    { title: "Addresses", subtitle: "Delivery and return addresses." },
    { title: "Notifications", subtitle: "Push, email and alerts." },
  ],
  security: [
    { title: "Privacy", subtitle: "Privacy controls and data." },
    { title: "Security", subtitle: "Password, devices and sessions." },
    { title: "Verification", subtitle: "Identity and business verification." },
  ],
  preferences: [{ title: "Currency", subtitle: "Display currency." }],
  dangerZone: [{ title: "Delete Account", subtitle: "Permanently remove your account." }],
} as const;

export const SETTINGS_V1_UX = {
  premium: true,
  minimalist: true,
  veryAiry: true,
  veryFast: true,
  veryIntuitive: true,
  mobileFirst: true,
  productionReady: true,
  findSectionUnderOneSecond: true,
} as const;

export const SETTINGS_V1_PROHIBITED = [
  "alte dimensiuni",
  "alte iconuri",
  "alte culori",
  "alte componente",
  "alt padding",
  "alt spacing",
  "alte proporții",
  "alte animații",
  "alt Design System",
] as const;

export const SETTINGS_V1_QA_CHAIN = [
  "PROFILE",
  "SETTINGS",
  "PERSONAL INFORMATION",
  "ADDRESSES",
  "NOTIFICATIONS",
  "PRIVACY",
  "SECURITY",
  "VERIFICATION",
  "CURRENCY",
  "DELETE ACCOUNT",
] as const;

export const SETTINGS_V1_LOCKS = {
  permanentLock: true,
  uiUxApproved: true,
  productionReady: true,
  futureModulesInheritMasters: true,
  oneDesignSystem: true,
  oneIconFamily: true,
  oneTemplate: true,
  fullWidth: true,
} as const;

/** Icon accent tones (Settings hub rows) — Profile master colour system. */
export type SettingsIconTone =
  | "purple"
  | "blue"
  | "orange"
  | "green"
  | "red"
  | "rovexo-blue"
  | "gold"
  | "soft-red";

export const SETTINGS_ICON_TONES: readonly SettingsIconTone[] = [
  "purple",
  "blue",
  "orange",
  "green",
  "red",
  "rovexo-blue",
  "gold",
  "soft-red",
] as const;

export const SETTINGS_ICON_TONE_BY_ROW: Record<string, SettingsIconTone> = {
  profile: "purple",
  addresses: "blue",
  notifications: "orange",
  privacy: "green",
  security: "red",
  verification: "rovexo-blue",
  currency: "gold",
  "delete-account": "soft-red",
};

/** Language preferences removed — English (UK) only. */
export const SETTINGS_V1_LANGUAGES: readonly LocaleCode[] = ["en-GB"] as const;

export type VerificationStatusLabel = "Not Started" | "Pending" | "Verified" | "Not Verified";

export const SETTINGS_V1_VERIFICATION_ROWS = [
  { id: "individual", title: "Individual Seller" },
  { id: "self-employed", title: "Self Employed" },
  { id: "ltd", title: "Ltd Company" },
  { id: "rovexo-verified", title: "ROVEXO VERIFIED" },
] as const;

export function settingsV1Snapshot() {
  return {
    version: SETTINGS_V1_VERSION,
    status: SETTINGS_V1_STATUS,
    masterRule: SETTINGS_V1_MASTER_RULE,
    inventory: SETTINGS_V1_INVENTORY,
    ux: SETTINGS_V1_UX,
    prohibited: [...SETTINGS_V1_PROHIBITED],
    qaChain: [...SETTINGS_V1_QA_CHAIN],
    locks: SETTINGS_V1_LOCKS,
  } as const;
}
