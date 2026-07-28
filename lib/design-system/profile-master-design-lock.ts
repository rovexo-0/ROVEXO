/**
 * ROVEXO Profile Master Design — UI LOCK (Platform Absolute Master v7.0).
 * Profile page is the official design system reference for the ENTIRE ROVEXO platform.
 * SSOT tokens: `lib/design-system/my-account-v1.ts` + `profile-master-tokens.ts` + Full Width Engine
 * Contract: `lib/design-system/profile-absolute-master-v7.ts`
 */

import {
  MY_ACCOUNT_V1_BUTTON,
  MY_ACCOUNT_V1_FULL_WIDTH,
  MY_ACCOUNT_V1_HEADER,
  MY_ACCOUNT_V1_SPACING,
  MY_ACCOUNT_V1_STATUS,
  MY_ACCOUNT_V1_SURFACES,
  MY_ACCOUNT_V1_TYPE,
} from "@/lib/design-system/my-account-v1";
import { ACCOUNT_SETTINGS_LAYOUT } from "@/lib/account/account-settings-v1";
import {
  PROFILE_ABSOLUTE_MASTER_CONTRACT,
  PROFILE_ABSOLUTE_MASTER_GOLDEN_RULE,
} from "@/lib/design-system/profile-absolute-master-v7";

export const PROFILE_MASTER_DESIGN_STATUS = "PERMANENTLY LOCKED" as const;
export const PROFILE_MASTER_DESIGN_VERSION = "7.0" as const;
export const PROFILE_MASTER_DESIGN_REFERENCE = "profile" as const;
export const PROFILE_MASTER_DESIGN_MY_ACCOUNT = MY_ACCOUNT_V1_STATUS;
export const PROFILE_MASTER_PLATFORM_CONTRACT = PROFILE_ABSOLUTE_MASTER_CONTRACT;

/** PROFILE PAGE = Absolute Master Design System for the entire platform (Owner permanent). */
export const PROFILE_IS_MASTER_PAGE = true as const;
export const PROFILE_IS_PLATFORM_MASTER_DESIGN_SYSTEM = true as const;

export const PROFILE_MASTER_DESIGN_RULES = {
  width: MY_ACCOUNT_V1_FULL_WIDTH.width,
  maxWidth: MY_ACCOUNT_V1_FULL_WIDTH.maxWidth,
  mobileFirst: true,
  background: "#FFFFFF",
  coloredIcons: true,
  masterPage: true,
  platformMasterDesignSystem: true,
  masterIconFamily: true,
  masterColorSystem: true,
  masterComponents: true,
  masterSpacingSystem: true,
  masterTypography: true,
  masterProportions: true,
  fullWidth: true,
  singleSourceOfTruth: true,
  /** Interactive cards only where required (Addresses) — tokens from MY_ACCOUNT_V1_CARD. */
  noDecorativeCards: true,
  noBorders: true,
  noContainers: true,
  noShadows: true,
  noBoxes: true,
  noRoundedSections: true,
  paddingXPx: MY_ACCOUNT_V1_FULL_WIDTH.paddingLeftPx,
  paddingYPx: MY_ACCOUNT_V1_FULL_WIDTH.paddingTopPx,
  headerHeightPx: MY_ACCOUNT_V1_HEADER.heightPx,
  pageTitlePx: MY_ACCOUNT_V1_TYPE.pageTitlePx,
  pageTitleWeight: MY_ACCOUNT_V1_TYPE.pageTitleWeight,
  sectionTitlePx: MY_ACCOUNT_V1_TYPE.sectionTitlePx,
  sectionTitleWeight: MY_ACCOUNT_V1_TYPE.sectionTitleWeight,
  bodyPx: MY_ACCOUNT_V1_TYPE.bodyPx,
  bodyWeight: MY_ACCOUNT_V1_TYPE.bodyWeight,
  smallPx: MY_ACCOUNT_V1_TYPE.smallPx,
  smallWeight: MY_ACCOUNT_V1_TYPE.smallWeight,
  descriptionPx: MY_ACCOUNT_V1_TYPE.descriptionPx,
  descriptionWeight: MY_ACCOUNT_V1_TYPE.descriptionWeight,
  componentSpacingPx: MY_ACCOUNT_V1_SPACING.componentPx,
  sectionSpacingPx: MY_ACCOUNT_V1_SPACING.sectionPx,
  radiusPx: MY_ACCOUNT_V1_SPACING.radiusPx,
  buttonHeightPx: MY_ACCOUNT_V1_BUTTON.heightPx,
  buttonRadiusPx: MY_ACCOUNT_V1_BUTTON.radiusPx,
  onePagePhilosophy: true,
  singleDesignSystem: true,
  onlyContentMayDiffer: true,
  designNeverDiffers: true,
  visualProportionLock: true,
  minVisualScore: 9.5,
  switchEngine: "ROVEXO SWITCH ENGINE v1.0",
  fullWidthEngine: "ROVEXO FULL WIDTH ENGINE v1.0",
  myAccountSurfaces: MY_ACCOUNT_V1_SURFACES,
  goldenRule: PROFILE_ABSOLUTE_MASTER_GOLDEN_RULE,
} as const;

/** Personal Information one-page field order (Save Engine v2 · Currency removed). */
export const ACCOUNT_DETAILS_ONE_PAGE_FIELDS = ACCOUNT_SETTINGS_LAYOUT;
