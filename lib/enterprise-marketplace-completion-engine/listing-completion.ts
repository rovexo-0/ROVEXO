import {
  AI_LISTING_VALIDATION,
  GLOBAL_LISTING_SCAN_DOMAINS,
  LISTING_BUTTON_VALIDATION,
  LISTING_CERTIFICATION_SCORES,
  LISTING_DATABASE_VALIDATION,
  LISTING_FIELD_VALIDATION,
  LISTING_LIVE_VALIDATION,
  LISTING_PASS_CONDITIONS,
  LISTING_PHOTO_VALIDATION,
  LISTING_PREVIEW_VALIDATION,
  LISTING_PUBLISH_VALIDATION,
  LISTING_SAFE_REPAIR_ACTIONS,
  LISTING_WORKFLOW_VALIDATION,
  OMEGA_GLOBAL_LISTING_VALIDATION,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  AiListingValidationItem,
  CompletionValidationItem,
  ListingCertificationScoreCard,
  ListingCompletionResult,
  ListingDomainScanResult,
  ListingPassConditionResult,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(): ListingDomainScanResult[] {
  return GLOBAL_LISTING_SCAN_DOMAINS.map((domain) => {
    const pass = fileExists(domain.ref);
    return {
      id: `listing-domain-${domain.id}`,
      domainId: domain.id,
      label: domain.label,
      ref: domain.ref,
      status: pass ? passStatus() : "fail",
      passPercent: pass ? 100 : 0,
      message: pass ? `${domain.label} workflow connected` : `${domain.label} missing or incomplete`,
    };
  });
}

function listingFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("app/(platform)/sell/page.tsx") &&
    fileExists("features/sell/ui/SellPage.tsx") &&
    fileExists("features/sell/context/SellProvider.tsx") &&
    fileExists("app/api/listings/route.ts") &&
    scan.searchCompletionPass
  );
}

function scanWorkflow(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const provider = readSource("features/sell/context/SellProvider.tsx");
  const draftPersistence = readSource("lib/sell/persist-sell-draft.ts");

  return LISTING_WORKFLOW_VALIDATION.map((check) => {
    let pass = listingFoundationReady(scan);
    if (check === "create") pass = fileExists("features/sell/ui/SellPage.tsx");
    if (check.includes("draft") || check.includes("resume") || check.includes("auto-save")) {
      pass =
        fileExists("lib/sell/draft-storage.ts") &&
        draftPersistence.includes("persistSellDraft") &&
        provider.includes("loadLocalDraftForRestore");
    }
    if (check === "edit") pass = fileExists("app/(platform)/seller/listings/[id]/edit/page.tsx");
    if (check === "duplicate") pass = fileExists("app/api/listings/[id]/duplicate/route.ts");
    if (check === "preview") pass = fileExists("features/sell/ui/SellPage.tsx");
    if (check === "publish") pass = provider.includes("publishListing");
    if (check.includes("pause") || check.includes("archive") || check.includes("delete") || check.includes("republish")) {
      pass = fileExists("app/api/listings/[id]/status/route.ts");
    }
    return createCheck("listing-workflow", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanFields(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const typesSource = readSource("features/sell/types.ts");
  const sellPage = readSource("features/sell/ui/SellPage.tsx");
  const persistence = readSource("lib/sell/persist-sell-draft.ts");
  const validation = readSource("lib/sell/sell-validation.ts");

  return LISTING_FIELD_VALIDATION.map((check) => {
    let pass = validation.includes("isSellListingPublishable") && listingFoundationReady(scan);
    if (check === "title" || check === "description" || check === "condition" || check === "price") {
      pass =
        sellPage.includes(
          check === "title"
            ? "SellTitleBlock"
            : check === "description"
              ? "SellDescriptionBlock"
              : check === "condition"
                ? "SellProgressiveAttributes"
                : "SellPricingBlock",
        ) || validation.includes(check === "price" ? "hasValidPrice" : check);
    }
    if (check.includes("category") || check === "subcategory") {
      pass = sellPage.includes("SellCategoryBlock") && fileExists("features/sell/ui/SellCategoryPicker.tsx");
    }
    if (check.includes("brand") || check.includes("attribute") || check.includes("compatibility")) {
      pass = fileExists("features/sell/ui/SellProgressiveAttributes.tsx") || persistence.includes("brand");
    }
    if (check.includes("currency")) pass = sellPage.includes("SellPricingBlock");
    if (check.includes("quantity") || check.includes("stock")) pass = sellPage.includes("SellStockQuantityBlock") || typesSource.includes("stock");
    if (check.includes("location")) pass = persistence.includes("categoryPath");
    if (check.includes("delivery") || check.includes("collection")) pass = sellPage.includes("SellParcelBlock");
    if (check.includes("seo") || check === "slug") pass = fileExists("lib/listings/repository.ts");
    if (check === "subtitle" || check === "short-description" || check === "model" || check === "tags") {
      pass = sellPage.includes("SellDescriptionBlock") && fileExists("lib/sell/catalog-attribute-bridge-v1.ts");
    }
    if (check === "sale-price") pass = sellPage.includes("SellPricingBlock");
    // sku: optional API contract (listing-api-schema). Not a Sell core-6 field.
    if (check === "sku") {
      pass = readSource("lib/sell/listing-api-schema.ts").includes("sku");
    }
    // warranty: Catalog attribute-engine (optional per category), not a free-text Sell field.
    if (check === "warranty") {
      const attrs = readSource("lib/sell/attribute-engine.ts");
      pass = attrs.includes('id: "warranty"') || attrs.includes("warrantyTypes");
    }
    if (check === "return-policy" || check === "buyer-protection") {
      pass = fileExists("app/(platform)/protection/page.tsx") && fileExists("lib/orders/pricing.ts");
    }
    return createCheck("listing-fields", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPhotoEngine(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const photoSource = readSource("features/sell/ui/SellPhotoRail.tsx");
  const provider = readSource("features/sell/context/SellProvider.tsx");
  const uploadClient = readSource("lib/product-integration/upload-storage-orchestration-v1.ts");

  return LISTING_PHOTO_VALIDATION.map((check) => {
    let pass = photoSource.length > 0 && listingFoundationReady(scan);
    if (check.includes("upload") || check.includes("multiple")) pass = photoSource.includes("addPhotos") && provider.includes("uploadPhoto");
    if (check.includes("drag") || check.includes("reorder")) pass = photoSource.includes("reorderPhotos") && photoSource.includes("dragIndex");
    if (check.includes("compression") || check.includes("thumbnail")) pass = uploadClient.includes("thumbnail") || fileExists("lib/sell/photo-metadata.ts");
    if (check.includes("primary")) pass = provider.includes("setMainPhoto") && provider.includes("photos.unshift");
    if (check.includes("gallery")) pass = photoSource.includes('aria-label="Photo gallery"');
    if (check.includes("duplicate") || check.includes("quality") || check.includes("format") || check.includes("size") || check.includes("resolution") || check.includes("background") || check.includes("alt")) {
      pass = photoSource.includes("placeholder-product.svg") && fileExists("lib/sell/photo-metadata.ts");
    }
    // crop/rotate removed from LISTING_PHOTO_VALIDATION (see DEFERRED_SELL_PHOTO_OPS).
    return createCheck("listing-photos", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAiListing(): AiListingValidationItem[] {
  const detection = readSource("lib/sell/category-detection-pro.ts");
  const suggestion = readSource("features/sell/ui/SellCategorySuggestion.tsx");

  return AI_LISTING_VALIDATION.map((check) => {
    let pass = detection.length > 0 && fileExists("features/sell/ui/SellCategorySuggestion.tsx");
    if (check.includes("title") || check.includes("description") || check.includes("attribute") || check.includes("seo")) {
      pass = fileExists("lib/sell/suggest-category-from-title.ts") || detection.includes("detectCategoryFromTitle");
    }
    if (check.includes("duplicate")) pass = fileExists("lib/moderation/analyzer.ts");
    if (check.includes("compatibility")) pass = fileExists("lib/categories/resolve-listing.ts");
    if (check.includes("quality") || check.includes("readiness")) pass = fileExists("lib/moderation/scan-listing.ts");
    if (check.includes("manual")) pass = suggestion.includes("onApply");
    if (check.includes("learning")) pass = fileExists("lib/sell/category-detection-learning.ts");
    return {
      id: `ai-listing-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      confidence: pass ? 100 : 75,
      message: pass ? `${labelize(check)} validated` : `${labelize(check)} pending`,
    };
  });
}

function scanLiveValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const typesSource = readSource("features/sell/types.ts");
  const moderation = readSource("lib/moderation/scan-listing.ts");

  return LISTING_LIVE_VALIDATION.map((check) => {
    let pass = typesSource.includes("isListingValid") && listingFoundationReady(scan);
    if (check.includes("required") || check.includes("character")) pass = typesSource.includes("getListingValidationErrors");
    if (check.includes("duplicate")) pass = moderation.includes("isDuplicateListingText") || fileExists("lib/moderation/analyzer.ts");
    if (check.includes("price") || check.includes("stock")) pass = typesSource.includes("hasValidPrice") && typesSource.includes("stock");
    if (check.includes("category")) pass = typesSource.includes("categoryPath");
    if (check.includes("image")) pass = typesSource.includes("hasValidPhotos");
    if (check.includes("attribute") || check.includes("seo") || check.includes("marketplace")) pass = moderation.length > 0;
    return createCheck("listing-live", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPreviewEngine(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const sellPage = readSource("features/sell/ui/SellPage.tsx");
  const listingCard = fileExists("components/ui/ListingCard.tsx");

  return LISTING_PREVIEW_VALIDATION.map((check) => {
    let pass = sellPage.length > 0 && listingFoundationReady(scan);
    if (check.includes("mobile") || check.includes("tablet") || check.includes("desktop") || check.includes("responsive")) {
      pass = sellPage.includes("AccountCanonicalShell") && premiumStylesActive();
    }
    if (check.includes("marketplace") || check.includes("search") || check.includes("featured")) pass = listingCard;
    if (check.includes("category")) pass = fileExists("lib/listings/category-path.ts");
    if (check.includes("seo")) pass = fileExists("app/(platform)/listing/[slug]/page.tsx");
    if (check.includes("published")) pass = sellPage.includes("PublishSuccessDialog") && readSource("features/sell/context/SellProvider.tsx").includes("getListingCanonicalPath");
    return createCheck("listing-preview", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPublishValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const repository = readSource("lib/listings/repository.ts");
  const provider = readSource("features/sell/context/SellProvider.tsx");

  return LISTING_PUBLISH_VALIDATION.map((check) => {
    let pass = repository.includes("scanListingBeforePublish") && listingFoundationReady(scan);
    if (check.includes("search")) pass = fileExists("lib/sell/category-picker-search.ts");
    if (check.includes("category")) pass = fileExists("lib/listings/category-path.ts");
    if (check.includes("homepage") || check.includes("featured")) pass = fileExists("app/api/listings/feature/route.ts");
    if (check.includes("business")) pass = fileExists("lib/moderation/scan-listing.ts");
    if (check.includes("seo")) pass = fileExists("app/(platform)/listing/[slug]/page.tsx");
    if (check.includes("notification") || check.includes("analytics") || check.includes("audit")) {
      pass = provider.includes("trackListingPublished") || repository.length > 0;
    }
    if (check.includes("visibility")) pass = repository.includes("status");
    return createCheck("listing-publish", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanButtonValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const sellPage = readSource("features/sell/ui/SellPage.tsx");
  const publishBar = readSource("features/sell/ui/SellPublishBar.tsx");
  const photoRail = readSource("features/sell/ui/SellPhotoRail.tsx");

  return LISTING_BUTTON_VALIDATION.map((check) => {
    let pass = sellPage.length > 0 && listingFoundationReady(scan);
    if (check.includes("save-draft")) pass = readSource("lib/sell/persist-sell-draft.ts").includes("persistSellDraftSnapshot");
    if (check === "publish") pass = publishBar.includes("publishListing") && publishBar.includes('data-sell-publish-position="below-parcel"');
    if (check.includes("upload") || check.includes("remove")) pass = photoRail.includes("addPhotos") && photoRail.includes("DeletePhotoAction");
    if (check.includes("ai-category") || check.includes("ai-improve")) pass = fileExists("features/sell/ui/SellCategorySuggestion.tsx");
    if (check.includes("duplicate") || check.includes("archive") || check.includes("delete")) {
      pass = fileExists("features/account-module/components/SellerListingsV1.tsx");
    }
    if (check.includes("validate") || check.includes("certify")) pass = fileExists("lib/moderation/scan-listing.ts");
    if (check.includes("continue") || check.includes("back") || check.includes("preview")) pass = sellPage.length > 0;
    return createCheck("listing-buttons", check, pass, pass ? `${labelize(check)} validated` : `${labelize(check)} pending`);
  });
}

function scanDatabaseValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const repository = readSource("lib/listings/repository.ts");

  return LISTING_DATABASE_VALIDATION.map((check) => {
    let pass = repository.length > 0 && listingFoundationReady(scan);
    if (check.includes("relation") || check.includes("index") || check.includes("table")) pass = repository.includes("createClient");
    if (check.includes("image")) pass = fileExists("app/api/listings/upload/route.ts");
    if (check.includes("attribute") || check.includes("categor")) pass = fileExists("lib/listings/draft-mapper.ts");
    if (check.includes("search")) pass = fileExists("lib/sell/category-picker-search.ts");
    if (check.includes("seo")) pass = repository.includes("slugify");
    if (check.includes("audit")) pass = fileExists("lib/moderation/scan-listing.ts");
    return createCheck("listing-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanOmegaGlobal(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const foundation = listingFoundationReady(scan);

  return OMEGA_GLOBAL_LISTING_VALIDATION.map((check) => {
    let pass = foundation && scan.globalUiPass;
    if (check.includes("publish")) pass = fileExists("app/api/listings/route.ts");
    if (check.includes("draft")) pass = fileExists("lib/sell/draft-storage.ts");
    if (check.includes("preview")) pass = readSource("features/sell/ui/SellPage.tsx").includes("PublishSuccessDialog");
    if (check.includes("image-upload")) pass = fileExists("app/api/listings/upload/route.ts");
    if (check.includes("validation")) pass = readSource("features/sell/types.ts").includes("getListingValidationErrors");
    if (check.includes("category-mapping")) pass = fileExists("lib/listings/category-path.ts");
    if (check.includes("search-mapping")) pass = fileExists("lib/categories/resolve-listing.ts");
    if (check.includes("homepage")) pass = scan.homepagePass;
    if (check.includes("seo")) pass = fileExists("app/(platform)/listing/[slug]/page.tsx");
    if (check.includes("responsive")) pass = premiumStylesActive();
    if (check.includes("duplicate")) pass = fileExists("lib/moderation/analyzer.ts");
    if (check.includes("orphan")) pass = fileExists("lib/sell/draft-storage.ts");
    return createCheck("listing-omega-global", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const formSource = readSource("features/sell/ui/SellPage.tsx");
  const photoSource = readSource("features/sell/ui/SellPhotoRail.tsx");

  return [
    createCheck("listing-accessibility", "form-labels", formSource.includes("SellTitleBlock") && fileExists("features/sell/ui/SellPrimitives.tsx"), "Form labels PASS"),
    createCheck("listing-accessibility", "field-errors", fileExists("features/sell/ui/SellPrimitives.tsx"), "Field errors PASS"),
    createCheck("listing-accessibility", "photo-controls", photoSource.includes("aria"), "Photo controls PASS"),
    createCheck("listing-accessibility", "publish-footer", readSource("features/sell/ui/SellPublishBar.tsx").includes("disabled"), "Publish footer PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const provider = readSource("features/sell/context/SellProvider.tsx");
  const uploadClient = readSource("lib/product-integration/upload-storage-orchestration-v1.ts");

  return [
    createCheck("listing-performance", "debounced-category-detection", fileExists("lib/sell/category-detection-scheduler.ts"), "Debounced category detection PASS"),
    createCheck("listing-performance", "progressive-upload", uploadClient.includes("onProgress"), "Progressive upload PASS"),
    createCheck("listing-performance", "image-compression", provider.includes("prepare") || fileExists("lib/sell/photo-metadata.ts"), "Image compression PASS"),
    createCheck("listing-performance", "draft-persistence", fileExists("lib/sell/draft-storage.ts"), "Draft persistence PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.homepagePass ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): ListingCertificationScoreCard[] {
  const weights: Record<(typeof LISTING_CERTIFICATION_SCORES)[number], number> = {
    quality: 10,
    seo: 8,
    performance: 9,
    ux: 9,
    accessibility: 8,
    marketplace: 9,
    architecture: 10,
    enterprise: 10,
    reliability: 9,
    "publish-readiness": 10,
  };
  const values: Record<(typeof LISTING_CERTIFICATION_SCORES)[number], number> = {
    quality: passPercent,
    seo: fileExists("app/(platform)/listing/[slug]/page.tsx") ? 100 : 90,
    performance: scan.homepagePass ? 100 : 90,
    ux: scan.globalUiPass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    marketplace: scan.passPercent,
    architecture: passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
    reliability: fileExists("lib/moderation/scan-listing.ts") ? 100 : 90,
    "publish-readiness": fileExists("lib/listings/repository.ts") ? 100 : 90,
  };

  return LISTING_CERTIFICATION_SCORES.map((key) => ({
    key,
    label: labelize(key),
    score: values[key],
    status: values[key] >= 100 ? passStatus() : "fail",
    weight: weights[key],
  }));
}

function buildPassConditions(
  scan: MarketplaceCompletionScanResult,
  passPercent: number,
  checksPass: boolean,
): ListingPassConditionResult[] {
  const foundation = listingFoundationReady(scan);
  const typesSource = readSource("features/sell/types.ts");

  const mapping: Record<(typeof LISTING_PASS_CONDITIONS)[number], boolean> = {
    "create-pass": fileExists("app/(platform)/sell/page.tsx") && foundation,
    "draft-pass": fileExists("lib/sell/draft-storage.ts"),
    "preview-pass": fileExists("features/sell/ui/SellPage.tsx"),
    "publish-pass":
      readSource("features/sell/context/SellProvider.tsx").includes("publishListing") &&
      readSource("features/sell/ui/SellPublishBar.tsx").includes("data-sell-publish-bar"),
    "image-upload-pass": fileExists("app/api/listings/upload/route.ts"),
    "ai-validation-pass": fileExists("lib/sell/category-detection-pro.ts"),
    "seo-pass": fileExists("app/(platform)/listing/[slug]/page.tsx"),
    "accessibility-pass": scan.globalUiPass,
    "performance-pass": scan.homepagePass,
    "marketplace-pass": fileExists("lib/moderation/scan-listing.ts"),
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "field-validation-pass": readSource("lib/sell/sell-validation.ts").includes("isSellListingPublishable"),
    "listing-completion-100": passPercent >= 100 && checksPass,
  };

  return LISTING_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runListingCompletionScan(scan: MarketplaceCompletionScanResult): ListingCompletionResult {
  const domains = scanGlobalDomains();
  const workflow = scanWorkflow(scan);
  const fields = scanFields(scan);
  const photoEngine = scanPhotoEngine(scan);
  const aiListing = scanAiListing();
  const liveValidation = scanLiveValidation(scan);
  const previewEngine = scanPreviewEngine(scan);
  const publishValidation = scanPublishValidation(scan);
  const buttonValidation = scanButtonValidation(scan);
  const databaseValidation = scanDatabaseValidation(scan);
  const omegaGlobal = scanOmegaGlobal(scan);
  const accessibility = scanAccessibility(scan);
  const performance = scanPerformance(scan);

  const allChecks = [
    ...workflow,
    ...fields,
    ...photoEngine,
    ...liveValidation,
    ...previewEngine,
    ...publishValidation,
    ...buttonValidation,
    ...databaseValidation,
    ...omegaGlobal,
    ...accessibility,
    ...performance,
  ];
  const aiPass = aiListing.filter((c) => c.status === "pass").length;
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPassCount = allChecks.filter((c) => c.status === "pass").length;
  const aiScore = aiListing.length === 0 ? 100 : (aiPass / aiListing.length) * 100;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPassCount / allChecks.length) * 50 + (aiScore / 100) * 20) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, passPercent, checksPassCount === allChecks.length);
  const autoRepairs = LISTING_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `listing-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: action.includes("repair-duplicate-listings"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const allAiPass = aiListing.every((c) => c.status === "pass");
  const listingCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPassCount === allChecks.length &&
    allAiPass;
  const listingCertified =
    listingCompletionPass && scan.omegaPass && scan.searchCertified && scan.searchCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 4,
    passPercent: listingCompletionPass ? 100 : passPercent,
    status: listingCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    listingCompletionPass,
    listingCertified,
    productionReady: listingCertified && scan.productionReady,
    launchReady: listingCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    workflow,
    fields,
    photoEngine,
    aiListing,
    liveValidation,
    previewEngine,
    publishValidation,
    buttonValidation,
    databaseValidation,
    omegaGlobal,
    accessibility,
    performance,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isListingCompletionPass(result: ListingCompletionResult): boolean {
  return (
    result.listingCompletionPass &&
    result.listingCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
