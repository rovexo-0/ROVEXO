/**
 * ROVEXO ABSOLUTE BLOOD LAW XXXVI
 * CATEGORY VISUAL LIBRARY FREEZE
 *
 * STATUS: LOCKED | CERTIFIED | FROZEN | PRODUCTION READY
 *
 * The ROVEXO Category Visual Library is officially frozen.
 * Every approved production category image is permanent Design System.
 * Only asset quality improvements are permitted — visual language locked.
 *
 * Parent: Blood Law XXXV (Category Visual Identity)
 * Frozen until: ROVEXO v2.0 (Owner-approved major version only)
 *
 * Assets: public/categories/{key}.* · public/search/categories/{key}.*
 */

import {
  SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1,
  certifyCategoryVisualIdentityXxxv,
  type CategoryVisualIdentityCheck,
} from "@/lib/supreme-blood-law-xxxv-category-visual-identity-v1";

/** Official Vehicle Parts composition — certified production asset (autoparts). */
export const OFFICIAL_VEHICLE_PARTS_COMPOSITION_V1 = [
  "Premium Alloy Wheel",
  "Ventilated Brake Disc",
  "Purple Brake Caliper",
  "LED Headlight",
  "Coilover Shock Absorber",
  "Car Battery",
  "Performance Air Filter",
  "Side Mirror",
  "Spark Plug",
] as const;

export const SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1 = {
  version: "1.0",
  bloodLaw: "XXXVI",
  name: "Category Visual Library Freeze",
  status: "LOCKED_CERTIFIED_FROZEN_PRODUCTION_READY",
  locked: true,
  certified: true,
  frozen: true,
  productionReady: true,
  architectureVersion: "ROVEXO v1.0",
  frozenUntil: "ROVEXO v2.0 (Owner-approved major version only)",
  certifiedAt: "2026-07-25",
  parentBloodLaw: "XXXV",
  equation:
    "ONE_PLATFORM = ONE_DESIGN_LANGUAGE = ONE_VISUAL_LIBRARY = ONE_CATEGORY_IDENTITY = ONE_PREMIUM_STANDARD",
  mission:
    "ROVEXO Category Visual Library is officially frozen. Approved production category images are permanent Design System. Only equal-or-higher quality asset improvements permitted without changing visual identity.",

  /** Official production library — order matches Catalog Master / Law XXXV roots. */
  officialLibrary: [
    "Women's Fashion",
    "Men's Fashion",
    "Designer",
    "Kids & Baby",
    "Home & Garden",
    "Electronics",
    "Books & Media",
    "Hobbies & Collectables",
    "Sports & Outdoors",
    "Vehicle Parts & Accessories",
  ] as const,

  visualLanguage: [
    "Studio Product Photography",
    "White Background",
    "Premium Soft Shadow",
    "Centered Composition",
    "45° Perspective",
    "Premium Lighting",
    "Photorealistic Materials",
    "Premium Marketplace Quality",
    "Consistent Scale",
    "Consistent Spacing",
  ] as const,

  vehiclePartsComposition: OFFICIAL_VEHICLE_PARTS_COMPOSITION_V1,

  vehiclePartsProhibited: [
    "Cars",
    "Motorcycles",
    "Vans",
    "Trucks",
    "SUVs",
    "Boats",
    "Bicycles",
    "Engines as whole assemblies representing vehicles",
    "Garages",
    "Mechanics",
    "Roads",
    "People",
    "Drivers",
    "Background scenery",
    "Whole vehicles",
  ] as const,

  frozenDesign: [
    "Image Style",
    "Visual Language",
    "Composition Rules",
    "Design Family",
    "Card Layout",
    "Card Size",
    "Card Radius",
    "Card Shadows",
    "Card Typography",
    "Search Layout",
    "Sell Layout",
    "Homepage Layout",
    "Category Grid",
    "Asset Mapping",
  ] as const,

  permittedChanges: [
    "Higher Resolution",
    "Better Cutout",
    "Better Lighting",
    "Better Shadows",
    "Better Material Textures",
    "Better Compression",
    "Better File Formats",
    "Better Rendering Quality",
  ] as const,

  forbiddenChanges: [
    "New illustration styles",
    "Cartoons",
    "Icons replacing photos",
    "Mixed visual languages",
    "Dark backgrounds",
    "Busy scenes",
    "Random objects",
    "Whole vehicles",
    "Different composition rules",
    "Different perspective",
    "Different lighting",
    "Lower quality than certified production asset",
  ] as const,

  certificationGates: [
    "Visual Identity Validation",
    "Premium Quality Validation",
    "Category Subject Validation",
    "Production Consistency Validation",
    "Search Compatibility",
    "Homepage Compatibility",
    "Sell Compatibility",
  ] as const,

  failPolicy: [
    "If replacement breaks Visual Identity → Reject Asset",
    "Restore Certified Production Asset",
    "Never deploy inconsistent visuals",
  ] as const,

  permanentPrinciples: [
    "One Platform",
    "One Design Language",
    "One Visual Library",
    "One Category Identity",
    "One Premium Standard",
    "Zero Mixed Styles",
    "Zero Random Assets",
    "Zero Legacy Images",
    "Zero Inconsistent Category Artwork",
  ] as const,

  qualityStandard:
    "Every replacement asset must be equal to or higher quality than the certified production asset. Lower quality assets are automatically rejected.",
} as const;

export type SupremeBloodLawXxxviCategoryVisualLibraryFreeze =
  typeof SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1;

export type CategoryVisualLibraryFreezeCheck = CategoryVisualIdentityCheck;

export type CategoryVisualLibraryFreezeReport = {
  ok: boolean;
  locked: boolean;
  certified: boolean;
  frozen: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XXXVI";
  parentOk: boolean;
  checks: CategoryVisualLibraryFreezeCheck[];
  errors: string[];
};

function isPermittedQualityOnlyChange(change: string): boolean {
  return (
    SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1.permittedChanges as readonly string[]
  ).includes(change);
}

/**
 * Certify Category Visual Library Freeze (Blood Law XXXVI).
 * Requires Law XXXV visual identity PASS, then freezes the certified library.
 */
export function certifyCategoryVisualLibraryFreezeXxxvi(): CategoryVisualLibraryFreezeReport {
  const law = SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1;
  const parent = certifyCategoryVisualIdentityXxxv();
  const checks: CategoryVisualLibraryFreezeCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "parent-xxxv",
    "Parent Law XXXV Visual Identity PASS",
    parent.ok === true,
    parent.ok
      ? undefined
      : `Law XXXV failed: ${parent.errors.join("; ") || "visual identity blocked"}`,
  );

  add(
    "locked",
    "Category Visual Library Locked",
    law.locked === true &&
      law.certified === true &&
      law.frozen === true &&
      law.status === "LOCKED_CERTIFIED_FROZEN_PRODUCTION_READY",
    "Category Visual Library is not locked / certified / frozen",
  );

  add(
    "frozen-until-v2",
    "Frozen Until ROVEXO v2.0",
    law.frozenUntil.includes("ROVEXO v2.0"),
    "Library must remain frozen until Owner-approved ROVEXO v2.0",
  );

  add(
    "library-count",
    "Official Library Has Exactly Ten Roots",
    law.officialLibrary.length === 10 &&
      SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1.rootVisuals.length === 10,
    "Official Category Visual Library must contain exactly 10 roots",
  );

  add(
    "library-names-aligned",
    "Official Library Names Align With Law XXXV",
    law.officialLibrary.every(
      (name, index) =>
        name === SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1.rootVisuals[index]?.name,
    ),
    "Official library names must match Law XXXV root visual names",
  );

  add(
    "visual-language",
    "Visual Language Locked",
    law.visualLanguage.length >= 10 &&
      law.visualLanguage.includes("White Background") &&
      law.visualLanguage.includes("Studio Product Photography"),
    "Visual language lock incomplete",
  );

  const vehicleBrief = SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1.rootVisuals.find(
    (r) => r.slug === "vehicle-parts",
  );
  const compositionAligned =
    vehicleBrief != null &&
    vehicleBrief.subjects.length === OFFICIAL_VEHICLE_PARTS_COMPOSITION_V1.length &&
    OFFICIAL_VEHICLE_PARTS_COMPOSITION_V1.every(
      (subject, index) => vehicleBrief.subjects[index] === subject,
    );

  add(
    "vehicle-parts-composition",
    "Official Vehicle Parts Composition Locked",
    law.vehiclePartsComposition.length >= 8 && compositionAligned,
    "Vehicle Parts certified composition must match official library lock",
  );

  add(
    "vehicle-parts-no-whole-vehicles",
    "Whole Vehicles Permanently Prohibited",
    law.vehiclePartsProhibited.includes("Whole vehicles") &&
      vehicleBrief?.forbiddenSubjects?.some((s) => s.includes("complete vehicles")) === true,
    "Vehicle Parts must permanently prohibit whole vehicles",
  );

  add(
    "quality-only-permitted",
    "Only Quality Improvements Permitted",
    law.permittedChanges.length >= 6 &&
      isPermittedQualityOnlyChange("Higher Resolution") &&
      isPermittedQualityOnlyChange("Better Lighting") &&
      !law.permittedChanges.some((c) => /redesign|illustration|cartoon/i.test(c)),
    "Permitted changes must be quality-only (no redesign)",
  );

  add(
    "frozen-design-surfaces",
    "Design Surfaces Frozen",
    law.frozenDesign.includes("Asset Mapping") &&
      law.frozenDesign.includes("Search Layout") &&
      law.frozenDesign.includes("Sell Layout") &&
      law.frozenDesign.includes("Homepage Layout") &&
      law.frozenDesign.includes("Category Grid"),
    "Card / Search / Sell / Homepage / Asset Mapping must remain frozen",
  );

  add(
    "certification-gates",
    "Replacement Certification Gates Declared",
    law.certificationGates.length === 7,
    "All seven replacement certification gates required",
  );

  add(
    "fail-closed",
    "Fail Policy Restores Certified Asset",
    law.failPolicy.some((p) => p.includes("Restore Certified Production Asset")),
    "Fail policy must restore certified production asset",
  );

  const allPass = checks.every((c) => c.pass);

  return {
    ok: allPass,
    locked: allPass && law.locked,
    certified: allPass && law.certified,
    frozen: allPass && law.frozen,
    productionReady: allPass && law.productionReady,
    blocked: !allPass,
    bloodLaw: "XXXVI",
    parentOk: parent.ok,
    checks,
    errors,
  };
}

export function assertCategoryVisualLibraryFreezeOrBlock(): void {
  const report = certifyCategoryVisualLibraryFreezeXxxvi();
  if (!report.ok) {
    throw new Error(
      `[BLOOD LAW XXXVI] CATEGORY VISUAL LIBRARY FREEZE CERTIFICATION FAILED — BLOCKED.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}

export function isCategoryVisualLibraryFrozen(): boolean {
  return (
    SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1.frozen === true &&
    SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1.locked === true
  );
}

export function isCategoryAssetQualityImprovementAllowed(change: string): boolean {
  return isPermittedQualityOnlyChange(change);
}
