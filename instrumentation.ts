export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // FLASH AUTH vs DB: skip startup blood gates so measurement can run (harness only).
  if (process.env.ROVEXO_FLASH_AUTH_DB === "1") return;

  const { validateSendcloudEnvironmentOnStartup } = await import("@/lib/shipping/env");
  validateSendcloudEnvironmentOnStartup();

  /**
   * Absolute Blood Laws XXXIII–XLII startup chain:
   * Startup → Catalog Protection → Validation → Production Certification →
   * Catalog Blood Certification → Global Production Freeze →
   * Category Visual Identity → Category Visual Library Freeze →
   * Official Brand Emblem → Official Brand Application →
   * Authentication Brand Freeze → Register Visual Polish Freeze →
   * Authentication Experience Final Freeze →
   * Full Platform Production Runtime (XLII) → Application Ready
   *
   * XLII Local Full Platform + Release gates are NOT executed here.
   * Instrumentation runs Production Runtime XLII only (fail closed on Production).
   *
   * Certification ALWAYS runs. Blocking is environment-aware
   * (see lib/startup/startup-certification-policy-v1.ts):
   * - Development: FAIL → log full report → continue (`npm run dev` must start)
   * - Vercel Preview: FAIL → log / warn → continue boot (never fail-close)
   * - Production / Certification mode: FAIL → throw → block startup
   * - P13.1 hotfix: brand source-integrity (.tsx/.css NFT prune) → warn + continue
   *   (never HTTP 500 because RovexoBrandLogo.tsx is absent from /var/task)
   */
  const { runStartupCertificationGate } = await import(
    "@/lib/startup/startup-certification-policy-v1"
  );
  const { runCatalogMasterStartupGate } = await import(
    "@/lib/catalog/catalog-master-protection-v1"
  );
  const { assertCatalogMasterProductionReleaseOrBlock } = await import(
    "@/lib/catalog/catalog-master-final-law-xxxii-v1"
  );
  const { assertCatalogMasterBloodCertificationOrBlock } = await import(
    "@/lib/catalog/supreme-blood-law-xxxiii-catalog-master-v1"
  );
  const { assertGlobalProductionFreezeOrBlock } = await import(
    "@/lib/supreme-blood-law-xxxiv-global-production-freeze-v1"
  );
  const { assertCategoryVisualIdentityOrBlock } = await import(
    "@/lib/supreme-blood-law-xxxv-category-visual-identity-v1"
  );
  const { assertCategoryVisualLibraryFreezeOrBlock } = await import(
    "@/lib/supreme-blood-law-xxxvi-category-visual-library-freeze-v1"
  );
  const { assertOfficialBrandEmblemOrBlock } = await import(
    "@/lib/supreme-blood-law-xxxvii-official-brand-emblem-v1"
  );
  const { assertOfficialBrandApplicationOrBlock } = await import(
    "@/lib/supreme-blood-law-xxxviii-official-brand-application-v1"
  );
  const { assertAuthenticationBrandFreezeOrBlock } = await import(
    "@/lib/supreme-blood-law-xxxix-authentication-brand-freeze-v1"
  );
  const { assertRegisterVisualPolishFreezeOrBlock } = await import(
    "@/lib/supreme-blood-law-xl-register-visual-polish-freeze-v1"
  );
  const { assertAuthenticationExperienceFinalFreezeOrBlock } = await import(
    "@/lib/supreme-blood-law-xli-authentication-experience-final-freeze-v1"
  );
  const { assertFullPlatformProductionRuntimeOrBlock } = await import(
    "@/lib/supreme-blood-law-xlii-full-platform-certification-v1"
  );
  const { assertCounterOfferCertificationOrBlock } = await import(
    "@/lib/supreme-blood-law-xliii-counter-offer-certification-v1"
  );
  const { assertFullDemoCertificationEnvironmentOrBlock } = await import(
    "@/lib/supreme-blood-law-xliv-full-demo-certification-environment-v1"
  );
  const { assertFinalLiveProductionCertificationOrBlock } = await import(
    "@/lib/supreme-blood-law-xlv-final-live-production-certification-v1"
  );
  const { getCategoryTree } = await import("@/lib/categories/queries");

  const tree = getCategoryTree();

  runStartupCertificationGate("Catalog Master Startup Gate", () => {
    runCatalogMasterStartupGate(() => tree);
  });
  runStartupCertificationGate("BLOOD XXXII Catalog Master Production Release", () => {
    assertCatalogMasterProductionReleaseOrBlock(tree);
  });
  runStartupCertificationGate("BLOOD XXXIII Catalog Master Blood Certification", () => {
    assertCatalogMasterBloodCertificationOrBlock(tree);
  });
  runStartupCertificationGate("BLOOD XXXIV Global Production Freeze", () => {
    assertGlobalProductionFreezeOrBlock();
  });
  runStartupCertificationGate("BLOOD XXXV Category Visual Identity", () => {
    assertCategoryVisualIdentityOrBlock();
  });
  runStartupCertificationGate("BLOOD XXXVI Category Visual Library Freeze", () => {
    assertCategoryVisualLibraryFreezeOrBlock();
  });
  runStartupCertificationGate("BLOOD XXXVII Official Brand Emblem", () => {
    assertOfficialBrandEmblemOrBlock();
  });
  runStartupCertificationGate("BLOOD XXXVIII Official Brand Application", () => {
    assertOfficialBrandApplicationOrBlock();
  });
  runStartupCertificationGate("BLOOD XXXIX Authentication Brand Freeze", () => {
    assertAuthenticationBrandFreezeOrBlock();
  });
  runStartupCertificationGate("BLOOD XL Register Visual Polish Freeze", () => {
    assertRegisterVisualPolishFreezeOrBlock();
  });
  runStartupCertificationGate("BLOOD XLI Authentication Experience Final Freeze", () => {
    assertAuthenticationExperienceFinalFreezeOrBlock();
  });
  runStartupCertificationGate("BLOOD XLII Full Platform Production Runtime", () => {
    assertFullPlatformProductionRuntimeOrBlock();
  });
  runStartupCertificationGate("BLOOD XLIII Counter Offer Certification", () => {
    assertCounterOfferCertificationOrBlock();
  });
  runStartupCertificationGate("BLOOD XLIV Full Demo Certification Environment", () => {
    assertFullDemoCertificationEnvironmentOrBlock();
  });
  runStartupCertificationGate("BLOOD XLV Final Live Production Certification", () => {
    assertFinalLiveProductionCertificationOrBlock();
  });

  const { assertRuntimeCatalogIndexOrBlock } = await import(
    "@/lib/catalog/runtime-catalog-index-v1"
  );
  runStartupCertificationGate("Suggest SSOT Runtime Catalog Index", () => {
    assertRuntimeCatalogIndexOrBlock();
  });
}
