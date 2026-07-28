/**
 * ROVEXO MY ACCOUNT v1.0 — UI/UX MASTER LOCK
 * STATUS: PERMANENTLY LOCKED · APPROVED
 *
 * RULE #1 — SINGLE DESIGN SYSTEM
 * PROFILE = visual master template = single source of truth for all My Account pages.
 * Forbidden: separate design systems for Profile / Settings / Addresses / Security / Verification.
 *
 * Final rule: side-by-side pages must be visually identical except CONTENT.
 */

export const MY_ACCOUNT_V1_NAME = "ROVEXO MY ACCOUNT" as const;
export const MY_ACCOUNT_V1_VERSION = "1.0" as const;
/** Owner Master Page Lock — permanent. */
export const MY_ACCOUNT_V1_STATUS = "PERMANENTLY LOCKED · APPROVED" as const;
export const MY_ACCOUNT_V1_MASTER_PAGE = "profile" as const;
export const MY_ACCOUNT_V1_DOM = "v1.0-ui-ux-lock" as const;

/**
 * MASTER PAGE LOCK (PERMANENT · OWNER APPROVED)
 * PROFILE PAGE is the ONLY master page of My Account v1.0.
 * No page may invent typography, spacing, icons, rows, headers, or proportions.
 * ALL pages inherit from Profile. ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.
 */
export const MY_ACCOUNT_V1_MASTER_PAGE_LOCK = {
  status: "PERMANENTLY LOCKED" as const,
  approved: true,
  permanentSsotContract: true,
  masterPage: "PROFILE PAGE" as const,
  onlyMasterPage: true,
  noPageMayHaveOwnDesignSystem: true,
  equals: [
    "MASTER PAGE",
    "MASTER DESIGN SYSTEM",
    "MASTER TYPOGRAPHY",
    "MASTER COMPONENTS",
    "MASTER FULL WIDTH",
    "MASTER TOKENS",
    "MASTER SPACING",
    "MASTER ICON FAMILY",
    "MASTER BUTTON SYSTEM",
    "MASTER HEADER SYSTEM",
    "SINGLE SOURCE OF TRUTH",
  ] as const,
  goldenRule: "ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES." as const,
  profileControls: [
    "typography",
    "font sizes",
    "font weights",
    "line heights",
    "full width",
    "spacing",
    "margins",
    "paddings",
    "icon family",
    "icon sizes",
    "chevrons",
    "buttons",
    "click areas",
    "row heights",
    "headers",
    "section spacing",
    "cards",
    "radius",
    "animations",
    "visual proportions",
    "UI behaviour",
  ] as const,
  noOtherPageMayOverride: true,
  inheritanceChain: [
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
    "ALL FUTURE MY ACCOUNT PAGES",
  ] as const,
  oneChangeRule: true,
  sideBySideRule: true,
  visualQaRule: true,
  productionGate: {
    blocksInventedPx: true,
    blocksInventedTypography: true,
    blocksInventedSpacing: true,
    blocksInventedIconSizes: true,
    blocksInventedComponents: true,
    blocksBrokenProfileInheritance: true,
    blocksFailedSideBySideQa: true,
  } as const,
  iconFamily: {
    component: "AccountIcon",
    menuClass: "ac-canonical__menu-icon",
    settingsGlyph: "SettingsMenuIconGlyph",
    coloredIconsRequired: true,
    privateIconFamiliesForbidden: true,
  } as const,
  colorSystem: {
    background: "#FFFFFF",
    accent: "ROVEXO purple",
    text: "black",
    iconTonesSsot: "lib/settings/settings-v1.ts · SettingsIconTone",
    privateColorSystemsForbidden: true,
  } as const,
  forbidden: [
    "page-local design system",
    "invented typography",
    "invented spacing",
    "invented paddings",
    "invented margins",
    "invented icon sizes",
    "invented component sizes",
    "invented button sizes",
    "invented row heights",
    "invented headers",
    "invented full width values",
    "invented click areas",
    "invented animations",
    "invented visual proportions",
    "overriding Profile tokens",
  ] as const,
  finalEquation: "PROFILE = SINGLE SOURCE OF TRUTH" as const,
} as const;

/** RULE #13 — Master template inheritance chain. */
export const MY_ACCOUNT_V1_SURFACES = [
  "Settings",
  "Personal Information",
  "Addresses",
  "Notifications",
  "Privacy",
  "Security",
  "Verification",
  "Currency",
  "Delete Account",
  "Future Subpages",
] as const;

/** RULE #18 — Pages that must be compared side-by-side in visual QA. */
export const MY_ACCOUNT_V1_VISUAL_QA_PAGES = [
  "Profile",
  "Personal Information",
  "Addresses",
  "Settings",
  "Security",
] as const;

/** RULE #21 — Production gate pages (each must score ≥ 9.5/10 vs Profile). */
export const MY_ACCOUNT_V1_PRODUCTION_PAGES = [
  "Profile",
  "Settings",
  "Personal Information",
  "Addresses",
  "Notifications",
  "Security",
  "Verification",
] as const;

/** RULE #20–#21 — Minimum visual score vs Profile master before UI LOCK / Freeze / Certification / Production. */
export const MY_ACCOUNT_V1_MIN_VISUAL_SCORE = 9.5 as const;

/** RULE #14–#21 — Visual Proportion Lock (permanent). */
export const MY_ACCOUNT_V1_VISUAL_PROPORTION = {
  rule14_profileIsAbsoluteStandard: true,
  rule14_partialInheritanceForbidden: true,
  rule14_profileToOneHundredOnly: true,
  rule15_visualClone: true,
  rule15_onlyContentMayDiffer: true,
  rule16_sameBreathingSpace: true,
  rule16_forbiddenPremiumVsCrowded: true,
  rule16_forbiddenPremiumVsCompressed: true,
  rule17_contentOnlyMayChange: true,
  rule17_structureLocked: true,
  rule17_proportionsLocked: true,
  rule17_dimensionsLocked: true,
  rule17_paddingLocked: true,
  rule17_spacingLocked: true,
  rule17_visualBehaviourLocked: true,
  rule18_sideBySideVisualQaRequired: true,
  rule18_qaPages: MY_ACCOUNT_V1_VISUAL_QA_PAGES,
  rule19_oneLookRule: true,
  rule19_sameProductFeelWithin3Seconds: true,
  rule20_rejectionIfAnyPageBelowMinScore: true,
  rule20_minScore: MY_ACCOUNT_V1_MIN_VISUAL_SCORE,
  rule21_productionRequiresAllPagesAtMinScore: true,
  rule21_productionPages: MY_ACCOUNT_V1_PRODUCTION_PAGES,
  goldenRule:
    "PROFILE = VISUAL MASTER TEMPLATE + VISUAL PROPORTION LOCK + SSOT + ONE DESIGN SYSTEM + ONE LOOK + ONE PREMIUM FEELING",
  permanentStatus: "ONLY CONTENT MAY DIFFER · DESIGN NEVER DOES",
} as const;

/** RULE #2 — Full Width Lock (Master Full Width Contract v1.1 · Design Decision #001). */
export const MY_ACCOUNT_V1_FULL_WIDTH = {
  width: "100%",
  maxWidth: "100%",
  paddingLeftPx: 16,
  paddingRightPx: 16,
  paddingTopPx: 24,
  paddingBottomPx: 24,
  sectionSpacingPx: 24,
  componentSpacingPx: 24,
  radiusPx: 16,
} as const;

/** RULE #3 — Header Lock. */
export const MY_ACCOUNT_V1_HEADER = {
  heightPx: 64,
  pattern: "< Back                    PAGE TITLE",
  backIdentical: true,
  titleIdentical: true,
  spacingIdentical: true,
  alignmentIdentical: true,
} as const;

/** RULE #4 — Typography Lock. */
export const MY_ACCOUNT_V1_TYPE = {
  pageTitlePx: 32,
  pageTitleWeight: 700,
  sectionTitlePx: 24,
  sectionTitleWeight: 700,
  bodyPx: 16,
  bodyWeight: 400,
  smallPx: 14,
  smallWeight: 400,
  /** Alias — body text. */
  descriptionPx: 16,
  descriptionWeight: 400,
} as const;

/** Spacing aliases (RULE #2). */
export const MY_ACCOUNT_V1_SPACING = {
  componentPx: MY_ACCOUNT_V1_FULL_WIDTH.componentSpacingPx,
  sectionPx: MY_ACCOUNT_V1_FULL_WIDTH.sectionSpacingPx,
  buttonPx: 24,
  radiusPx: MY_ACCOUNT_V1_FULL_WIDTH.radiusPx,
} as const;

/** RULE #5 — Button Lock (Primary CTA = official purple/pink gradient). */
export const MY_ACCOUNT_V1_BUTTON = {
  heightPx: 56,
  width: "100%",
  radiusPx: 16,
  primaryGradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 48%, #7c3aed 100%)",
  primaryColourLock: true,
  onePrimaryButtonSystem: true,
  examples: [
    "ADD ADDRESS",
    "ADD BUSINESS ADDRESS",
    "SAVE ADDRESS",
    "VERIFY ACCOUNT",
    "CONTINUE",
    "SAVE CHANGES",
  ] as const,
} as const;

/** RULE #6 — Card Lock (Addresses and any required cards). */
export const MY_ACCOUNT_V1_CARD = {
  radiusPx: 16,
  paddingPx: 24,
  spacingPx: 24,
  example: {
    badge: "DEFAULT",
    name: "Mihai Palade",
    line: "92 Dora Street",
    country: "United Kingdom",
    action: "Edit",
  },
} as const;

/** RULE #7 — Account Details inherits Profile 100% (no narrower / denser variants). */
export const MY_ACCOUNT_V1_ACCOUNT_DETAILS = {
  inheritsProfile100Percent: true,
  forbiddenNarrowerThanProfile: true,
  forbiddenMoreCompressedThanProfile: true,
  forbiddenMoreAiryThanProfile: true,
} as const;

/** RULE #8–#10 — Addresses (Owner approved mockup · Profile 100%). */
export const MY_ACCOUNT_V1_ADDRESSES = {
  inheritsProfile100Percent: true,
  ownerApprovedMockupLocked: true,
  doNotRedesign: true,
  personalOnlyDefault: true,
  businessTabRequiresVerification: false,
  neverShowBothScopesSimultaneously: true,
  businessTabHiddenUntilVerified: true,
  structure: {
    personalTab: ["Personal Addresses", "Address cards", "Add Address"] as const,
    businessTab: ["Business Addresses", "Business Address cards", "Add Business Address"] as const,
  },
  editSheetActions: [
    "Edit Address",
    "Set as Default",
    "Delete Address",
    "Cancel",
  ] as const,
  neverShowDeletePermanentlyOnCard: true,
  primaryCtaGradientLocked: true,
  primaryCtaHeightPx: 56,
  primaryCtaRadiusPx: 16,
  primaryCtaWidth: "100%",
  iconFamily: "Profile / AccountIcon" as const,
  visualTokensMustMatchProfile: true,
  goldenRule:
    "PROFILE DESIGN SYSTEM + OWNER APPROVED ADDRESSES MOCKUP = FINAL (NEVER PROFILE = ADDRESSES)",
  mergeOnly: true,
  neverCopyProfileAsAddresses: true,
} as const;

/** RULE #12 — Prohibited. */
export const MY_ACCOUNT_V1_PROHIBITED = [
  "2 Design Systems",
  "alternate proportions",
  "alternate widths",
  "alternate dimensions",
  "alternate paddings",
  "alternate button sizes",
  "alternate card sizes",
  "alternate typography rules",
  "alternate visual proportions",
  "alternate icon families",
  "alternate colour systems",
  "alternate headers",
  "Profile-only design system",
  "Settings-only design system",
  "Addresses-only design system",
  "Security-only design system",
  "Verification-only design system",
] as const;

/** RULE #1 · #11 · Final — locks. */
export const MY_ACCOUNT_V1_LOCKS = {
  singleDesignSystem: true,
  profileIsVisualMasterTemplate: true,
  profileIsMasterPage: true,
  profileIsSingleSourceOfTruth: true,
  masterPageLock: true,
  masterIconFamily: true,
  masterColorSystem: true,
  masterComponents: true,
  masterSpacingSystem: true,
  masterTypography: true,
  masterProportions: true,
  fullWidthLock: true,
  headerLock: true,
  typographyLock: true,
  buttonLock: true,
  cardLock: true,
  accountDetailsLock: true,
  addressesLock: true,
  businessRuleLock: true,
  editRuleLock: true,
  visualIdentityLock: true,
  visualProportionLock: true,
  visualCloneLock: true,
  pageBreathingLock: true,
  contentLock: true,
  visualTestLock: true,
  oneLookRule: true,
  rejectionRule: true,
  productionRule: true,
  mobileFirstLock: true,
  uiUxLock: true,
  productionReady: true,
  permanentlyLocked: true,
  /** Only acceptable difference between My Account pages. */
  onlyContentMayDiffer: true,
  designNeverDiffers: true,
  /** RULE #22–#28 — Master Template Engine. */
  masterTemplateEngine: true,
  inheritanceLock: true,
  oneChangeRule: true,
  designLockIdenticalTokens: true,
  masterComponentLock: true,
  productionGateRequiresTemplate: true,
  futureProofInheritance: true,
} as const;

/** RULE #22 — Master Template Engine chain (PROFILE → MyAccountTemplate → engines). */
export const MY_ACCOUNT_V1_MASTER_TEMPLATE = {
  component: "MyAccountTemplate",
  path: "features/account-canonical/MyAccountTemplate.tsx",
  engines: [
    "HEADER ENGINE",
    "SPACING ENGINE",
    "BUTTON ENGINE",
    "CARD ENGINE",
    "TYPOGRAPHY ENGINE",
    "RESPONSIVE ENGINE",
    "FULL WIDTH ENGINE",
  ] as const,
  chain: [
    "PROFILE",
    "MyAccountTemplate.tsx",
    "HEADER ENGINE",
    "SPACING ENGINE",
    "BUTTON ENGINE",
    "CARD ENGINE",
    "TYPOGRAPHY ENGINE",
    "RESPONSIVE ENGINE",
    "FULL WIDTH ENGINE",
    "MY ACCOUNT v1.0",
  ] as const,
} as const;

/** RULE #23 — Pages that MUST inherit MyAccountTemplate (never private design systems). */
export const MY_ACCOUNT_V1_INHERITANCE_PAGES = [
  "Settings",
  "Addresses",
  "Personal Information",
  "Security",
  "Verification",
  "Privacy",
  "Currency",
  "Notifications",
] as const;

/** RULE #23 · #26 — Forbidden private page design systems. */
export const MY_ACCOUNT_V1_FORBIDDEN_PRIVATE_PAGES = [
  "Addresses.tsx",
  "Security.tsx",
  "Verification.tsx",
  "Currency.tsx",
  "Privacy.tsx",
  "Notifications.tsx",
  "AccountDetails.tsx",
  "Settings.tsx",
] as const;

/** RULE #24 — One Change Rule: Profile token change propagates to all inheriting pages. */
export const MY_ACCOUNT_V1_ONE_CHANGE_RULE = {
  enabled: true,
  examples: [
    "Button Size → all pages",
    "Header Size → all pages",
    "Icon Family → all pages",
    "Spacing → all pages",
    "Typography → all pages",
  ] as const,
} as const;

/** RULE #25 — Design Lock: identical tokens across pages (content only may differ). */
export const MY_ACCOUNT_V1_DESIGN_LOCK = {
  identicalPadding: true,
  identicalButtonHeight: true,
  identicalRadius: true,
  identicalWidth: true,
  onlyContentMayDiffer: true,
} as const;

/** RULE #27 — Production gate: private padding/spacing/header/buttons/components/proportions → REJECTED. */
export const MY_ACCOUNT_V1_TEMPLATE_PRODUCTION_GATE = {
  forbiddenPrivatePadding: true,
  forbiddenPrivateSpacing: true,
  forbiddenPrivateHeader: true,
  forbiddenPrivateButtons: true,
  forbiddenPrivateComponents: true,
  forbiddenPrivateProportions: true,
  blocksUiLock: true,
  blocksFreeze: true,
  blocksCertification: true,
  blocksProduction: true,
} as const;

/** RULE #28 — Future pages inherit MyAccountTemplate (never build individually). */
export const MY_ACCOUNT_V1_FUTURE_PROOF = {
  inheritOnly: true,
  examples: [
    "Subscription.tsx",
    "Premium Seller",
    "Insurance",
    "Rewards",
    "AI Settings",
    "Theme Settings",
    "Wallet Settings",
  ] as const,
} as const;

export const MY_ACCOUNT_V1_RULES = [
  "RULE #1 SINGLE DESIGN SYSTEM",
  "RULE #2 FULL WIDTH LOCK",
  "RULE #3 HEADER LOCK",
  "RULE #4 TYPOGRAPHY",
  "RULE #5 BUTTON LOCK",
  "RULE #6 CARD LOCK",
  "RULE #7 PERSONAL INFORMATION LOCK",
  "RULE #8 ADDRESSES LOCK",
  "RULE #9 BUSINESS RULE",
  "RULE #10 EDIT RULE",
  "RULE #11 VISUAL RULE",
  "RULE #12 PROHIBITED RULE",
  "RULE #13 MASTER TEMPLATE",
  "RULE #14 VISUAL PROPORTION LOCK",
  "RULE #15 VISUAL CLONE",
  "RULE #16 PAGE BREATHING",
  "RULE #17 CONTENT LOCK",
  "RULE #18 VISUAL TEST LOCK",
  "RULE #19 ONE LOOK RULE",
  "RULE #20 REJECTION RULE",
  "RULE #21 PRODUCTION RULE",
  "RULE #22 MASTER TEMPLATE ENGINE",
  "RULE #23 INHERITANCE LOCK",
  "RULE #24 ONE CHANGE RULE",
  "RULE #25 DESIGN LOCK",
  "RULE #26 MASTER COMPONENT LOCK",
  "RULE #27 PRODUCTION GATE",
  "RULE #28 FUTURE PROOF LOCK",
] as const;

/**
 * RULE #20–#21 — Fail-closed visual gate.
 * Any page score below 9.5/10 → UI LOCK / Freeze / Certification / Production REJECTED.
 */
export function evaluateMyAccountVisualGate(
  scores: Partial<Record<(typeof MY_ACCOUNT_V1_PRODUCTION_PAGES)[number], number>>,
): {
  pass: boolean;
  rejected: boolean;
  minScore: typeof MY_ACCOUNT_V1_MIN_VISUAL_SCORE;
  failedPages: string[];
} {
  const failedPages: string[] = [];
  for (const page of MY_ACCOUNT_V1_PRODUCTION_PAGES) {
    const score = scores[page];
    if (score == null || score < MY_ACCOUNT_V1_MIN_VISUAL_SCORE) {
      failedPages.push(page);
    }
  }
  const pass = failedPages.length === 0;
  return {
    pass,
    rejected: !pass,
    minScore: MY_ACCOUNT_V1_MIN_VISUAL_SCORE,
    failedPages,
  };
}

export function myAccountV1Snapshot() {
  return {
    name: MY_ACCOUNT_V1_NAME,
    version: MY_ACCOUNT_V1_VERSION,
    status: MY_ACCOUNT_V1_STATUS,
    masterPage: MY_ACCOUNT_V1_MASTER_PAGE,
    masterPageLock: MY_ACCOUNT_V1_MASTER_PAGE_LOCK,
    dom: MY_ACCOUNT_V1_DOM,
    rules: [...MY_ACCOUNT_V1_RULES],
    surfaces: [...MY_ACCOUNT_V1_SURFACES],
    fullWidth: MY_ACCOUNT_V1_FULL_WIDTH,
    header: MY_ACCOUNT_V1_HEADER,
    type: MY_ACCOUNT_V1_TYPE,
    spacing: MY_ACCOUNT_V1_SPACING,
    button: MY_ACCOUNT_V1_BUTTON,
    card: MY_ACCOUNT_V1_CARD,
    accountDetails: MY_ACCOUNT_V1_ACCOUNT_DETAILS,
    addresses: MY_ACCOUNT_V1_ADDRESSES,
    prohibited: [...MY_ACCOUNT_V1_PROHIBITED],
    visualProportion: MY_ACCOUNT_V1_VISUAL_PROPORTION,
    visualQaPages: [...MY_ACCOUNT_V1_VISUAL_QA_PAGES],
    productionPages: [...MY_ACCOUNT_V1_PRODUCTION_PAGES],
    minVisualScore: MY_ACCOUNT_V1_MIN_VISUAL_SCORE,
    masterTemplate: MY_ACCOUNT_V1_MASTER_TEMPLATE,
    inheritancePages: [...MY_ACCOUNT_V1_INHERITANCE_PAGES],
    forbiddenPrivatePages: [...MY_ACCOUNT_V1_FORBIDDEN_PRIVATE_PAGES],
    oneChangeRule: MY_ACCOUNT_V1_ONE_CHANGE_RULE,
    designLock: MY_ACCOUNT_V1_DESIGN_LOCK,
    templateProductionGate: MY_ACCOUNT_V1_TEMPLATE_PRODUCTION_GATE,
    futureProof: MY_ACCOUNT_V1_FUTURE_PROOF,
    locks: MY_ACCOUNT_V1_LOCKS,
  } as const;
}
