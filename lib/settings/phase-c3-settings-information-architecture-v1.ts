/**
 * ROVEXO Phase C.3 — Settings Information Architecture
 *
 * STATUS: ACTIVE · Account Control Centre
 *
 * Settings is the single hub for account, legal, privacy, security,
 * support, verification, documentation, preferences, and platform information.
 * Design inherits Profile 100% — only content/navigation may change.
 */

export const PHASE_C3_SETTINGS_IA_V1 = {
  id: "phase-c3-settings-information-architecture-v1",
  version: "1.0.0",
  status: "ACTIVE",
  lastUpdated: "30 July 2026",
  hubRoute: "/account/settings",
  hubAlias: "/settings",
  role: "ACCOUNT_CONTROL_CENTRE",

  profileMenuRemoves: ["Help Centre", "Legal Information"] as const,
  profileMenuKeeps: [
    "Favourites",
    "Balance",
    "My Orders",
    "Holiday Mode",
    "Promote",
    "Settings",
    "Rovexo Ideas",
  ] as const,

  sections: [
    "ACCOUNT",
    "SUPPORT",
    "LEGAL",
  ] as const,

  /** Canonical routes — one location per concern (no parallel pages). */
  routes: {
    profile: "/account/profile",
    personalInformation: "/account/profile",
    verification: "/account/verification",
    security: "/account/security",
    privacy: "/account/privacy",
    notifications: "/notifications/settings",
    addresses: "/account/addresses",
    currency: "/account/preferences/currency",
    language: "/account/preferences/currency",
    accessibility: "/legal/accessibility-statement",
    sellingPreferences: "/sell",
    buyingPreferences: "/orders",
    holidayMode: "/account",
    savedSearches: "/search",
    blockedUsers: "/account/blocked-users",
    wallet: "/wallet",
    paymentMethods: "/wallet/payment-methods",
    payoutMethods: "/wallet/bank-accounts",
    transactionHistory: "/wallet/transactions",
    hmrc: "/seller/compliance",
    help: "/help",
    contactSupport: "/support",
    reportProblem: "/support",
    feedback: "/account/ideas",
    legalIndex: "/legal",
    terms: "/legal/terms-and-conditions",
    privacyPolicy: "/legal/privacy-policy",
    cookiePolicy: "/legal/cookie-policy",
    communityGuidelines: "/legal/community-guidelines",
    prohibitedItems: "/legal/prohibited-restricted-items",
    buyerProtection: "/legal/buyer-protection",
    sellerProtection: "/legal/seller-protection",
    fees: "/legal/platform-fee-policy",
    digitalPlatformReporting: "/legal/digital-platform-reporting-tax-notice",
    gdpr: "/legal/gdpr-data-rights",
    legalChangelog: "/legal/legal-changelog",
  } as const,

  /** LEGAL section in Settings — Legal Information + HMRC Reporting. Accessibility is Legal Centre only. */
  settingsLegalRowsOnly: ["Legal Information", "HMRC Reporting"] as const,
  /** SUPPORT section — Help Centre only (Contact Support removed from Settings). */
  settingsSupportRowsOnly: ["Help Centre"] as const,
  /** Accessibility is not a Settings → Account row — Legal Centre document only. */
  accessibilityCanonicalRoute: "/legal/accessibility-statement",

  helpLastUpdated: "30 July 2026",
  legalLastUpdated: "30 July 2026",
} as const;

export type PhaseC3SettingsIaV1 = typeof PHASE_C3_SETTINGS_IA_V1;
