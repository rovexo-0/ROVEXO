/**
 * Addresses v1.0 — MASTER PAGE LOCK + OWNER APPROVED MOCKUP (PERMANENT).
 * PROFILE = master · Addresses = Profile design + approved mockup · content only.
 */

export const ADDRESSES_STATUS =
  "PERMANENT_LOCK · OWNER_APPROVED_MOCKUP_3 · PROFILE_100_PERCENT · COMPONENTS_COMPLETE" as const;
export const ADDRESSES_UI_DATA_ATTR = "v1.0-ui-lock" as const;
export const ADDRESSES_MASTER_LOCK_DOM = "v1.0-master-page-lock" as const;
export const ADDRESSES_ROUTE = "/account/addresses" as const;
export const ADDRESSES_MOCKUP_REF = "IMAGE_MOCKUP_#3" as const;

/** Mandatory component files — NO COMPONENT = NO PASS. */
export const ADDRESSES_MANDATORY_COMPONENTS = [
  "AddressesTabs.tsx",
  "AddressCard.tsx",
  "PersonalAddresses.tsx",
  "BusinessAddresses.tsx",
  "AddressForm.tsx",
  "BusinessAddressForm.tsx",
  "EditAddress.tsx",
  "AddressesPage.tsx",
] as const;

export const ADDRESSES_COMPONENTS_DIR = "features/account/components/addresses" as const;

/** Owner-approved structure — permanently locked (do not redesign). */
export const ADDRESSES_APPROVED_STRUCTURE = {
  personalTab: {
    section: "Saved Addresses",
    cards: "Address card × N",
    cta: "Add Address",
    actions: ["Edit", "Delete"] as const,
    badges: ["Default"] as const,
  },
  businessTab: {
    section: "Saved Addresses",
    cards: "Business Address card × N",
    cta: "Add Business Address",
    actions: ["Edit", "Delete"] as const,
    badges: ["Default Business", "VAT Registered"] as const,
    supports: ["Company Name", "Warehouse Address", "VAT Registered"] as const,
  },
  neverShowBothTabsContentSimultaneously: true,
  businessTabRequiresVerification: false,
  layout: {
    width: "100%",
    padX: 24,
    padTop: 24,
    padBottom: 32,
    sectionGap: 24,
    cardGap: 16,
    buttonGap: 24,
    headerHeight: 56,
    tabHeight: 48,
    tabRadius: 16,
    cardRadius: 16,
    cardPadding: 20,
    badgeHeight: 28,
    ctaHeight: 56,
    ctaRadius: 16,
    ctaFontSize: 18,
    ctaFontWeight: 600,
  },
} as const;

export const ADDRESSES_INHERITS_FROM_PROFILE = [
  "Header",
  "Typography",
  "Font sizes",
  "Font weights",
  "Paddings",
  "Margins",
  "Spacing",
  "Radius",
  "Full Width",
  "Component sizes",
  "Icon family",
  "Colours",
  "Animations",
  "Hover states",
  "Loading states",
  "Skeletons",
  "CTA dimensions",
  "Visual proportions",
  "Button system",
  "Primary CTA",
  "Design tokens",
] as const;

export const ADDRESSES_FORBIDDEN_REDESIGN = [
  "third design",
  "increase text sizes",
  "decrease text sizes",
  "increase paddings",
  "decrease paddings",
  "compressed layouts",
  "larger buttons",
  "smaller buttons",
  "another icon family",
  "redesign cards",
  "redesign tabs",
  "redesign buttons",
  "redesign spacing",
  "redesign typography",
  "blue colours",
  "pills tabs",
  "alternative tabs",
  "partial inheritance",
] as const;
