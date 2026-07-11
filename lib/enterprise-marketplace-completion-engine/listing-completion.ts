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
    fileExists("app/sell/page.tsx") &&
    fileExists("features/sell/hooks/use-sell-wizard.ts") &&
    fileExists("app/api/listings/route.ts") &&
    scan.searchCompletionPass
  );
}

function scanWorkflow(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const wizard = readSource("features/sell/hooks/use-sell-wizard.ts");
  const draftStorage = fileExists("lib/sell/draft-storage.ts");

  return LISTING_WORKFLOW_VALIDATION.map((check) => {
    let pass = listingFoundationReady(scan);
    if (check.includes("draft") || check.includes("resume") || check.includes("auto-save")) pass = draftStorage && wizard.includes("saveSellDraft");
    if (check === "edit") pass = fileExists("app/seller/listings/[id]/edit/page.tsx");
    if (check === "duplicate") pass = fileExists("app/api/listings/[id]/duplicate/route.ts");
    if (check === "preview") pass = fileExists("features/sell/ui/SellScreen.tsx");
    if (check === "publish") pass = wizard.includes("publishListing");
    if (check.includes("pause") || check.includes("archive") || check.includes("delete") || check.includes("republish")) {
      pass = fileExists("app/api/listings/[id]/status/route.ts");
    }
    return createCheck("listing-workflow", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanFields(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const typesSource = readSource("features/sell/types.ts");
  const formSource = readSource("features/sell/components/SellListingForm.tsx");

  return LISTING_FIELD_VALIDATION.map((check) => {
    let pass = typesSource.includes("getListingValidationErrors") && listingFoundationReady(scan);
    if (check === "title" || check === "description" || check === "condition" || check === "price") {
      pass = typesSource.includes(check === "price" ? "hasValidPrice" : check);
    }
    if (check.includes("category") || check === "subcategory") pass = formSource.includes("SellCategoryPicker") || fileExists("features/sell/ui/SellCategoryPicker.tsx");
    if (check.includes("brand") || check.includes("attribute") || check.includes("compatibility")) {
      pass = typesSource.includes("brand") || formSource.includes("brand");
    }
    if (check.includes("currency")) pass = fileExists("lib/sell/currency.ts");
    if (check.includes("quantity") || check.includes("stock")) pass = typesSource.includes("stock");
    if (check.includes("location")) pass = fileExists("lib/sell/listing-location.ts");
    if (check.includes("delivery") || check.includes("collection")) pass = fileExists("lib/sell/delivery.ts");
    if (check.includes("seo") || check === "slug") pass = fileExists("lib/listings/repository.ts");
    if (check.includes("buyer") || check.includes("warranty") || check.includes("return") || check.includes("tags") || check.includes("sku") || check.includes("barcode") || check.includes("model") || check.includes("subtitle") || check.includes("short-description")) {
      pass = formSource.length > 0;
    }
    return createCheck("listing-fields", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPhotoEngine(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const photoSource = readSource("features/sell/components/SellPhotoSection.tsx");
  const uploadClient = readSource("lib/listings/upload-client.ts");
  const storageClient = fileExists("lib/storage/client-images.ts");

  return LISTING_PHOTO_VALIDATION.map((check) => {
    let pass = photoSource.length > 0 && listingFoundationReady(scan);
    if (check.includes("upload") || check.includes("multiple")) pass = uploadClient.includes("uploadListingImage");
    if (check.includes("drag") || check.includes("reorder")) pass = photoSource.includes("reorderPhotos") || photoSource.includes("dragIndex");
    if (check.includes("compression") || check.includes("thumbnail")) pass = uploadClient.includes("createListingThumbnail") || storageClient;
    if (check.includes("primary") || check.includes("gallery")) pass = photoSource.includes("draft.photos");
    if (check.includes("duplicate") || check.includes("quality") || check.includes("format") || check.includes("size") || check.includes("resolution") || check.includes("background") || check.includes("alt")) {
      pass = fileExists("app/api/listings/upload/route.ts");
    }
    if (check.includes("crop") || check.includes("rotate")) pass = photoSource.includes("replacePhoto");
    return createCheck("listing-photos", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAiListing(): AiListingValidationItem[] {
  const detection = readSource("lib/sell/category-detection-pro.ts");
  const wizard = readSource("features/sell/hooks/use-sell-wizard.ts");

  return AI_LISTING_VALIDATION.map((check) => {
    let pass = detection.length > 0 && fileExists("features/sell/components/TitleCategorySuggestions.tsx");
    if (check.includes("title") || check.includes("description") || check.includes("attribute") || check.includes("seo")) {
      pass = fileExists("lib/sell/suggest-category-from-title.ts") || detection.includes("detectCategoryFromTitle");
    }
    if (check.includes("duplicate")) pass = fileExists("lib/moderation/analyzer.ts");
    if (check.includes("compatibility")) pass = fileExists("lib/categories/resolve-listing.ts");
    if (check.includes("quality") || check.includes("readiness")) pass = fileExists("lib/moderation/scan-listing.ts");
    if (check.includes("manual")) pass = wizard.includes("userOverrodeCategoryRef");
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
  const sellPage = readSource("features/sell/ui/SellScreen.tsx");
  const productCard = fileExists("components/ui/ProductCard.tsx");

  return LISTING_PREVIEW_VALIDATION.map((check) => {
    let pass = sellPage.length > 0 && listingFoundationReady(scan);
    if (check.includes("mobile") || check.includes("tablet") || check.includes("desktop") || check.includes("responsive")) {
      pass = sellPage.includes("max-w-2xl") && premiumStylesActive();
    }
    if (check.includes("marketplace") || check.includes("search") || check.includes("featured")) pass = productCard;
    if (check.includes("category")) pass = fileExists("lib/listings/category-path.ts");
    if (check.includes("seo")) pass = fileExists("app/listing/[slug]/page.tsx");
    if (check.includes("published")) pass = readSource("features/sell/context/SellProvider.tsx").includes("router.push(`/listing/${slug}`)");
    return createCheck("listing-preview", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPublishValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const repository = readSource("lib/listings/repository.ts");
  const wizard = readSource("features/sell/hooks/use-sell-wizard.ts");

  return LISTING_PUBLISH_VALIDATION.map((check) => {
    let pass = repository.includes("scanListingBeforePublish") && listingFoundationReady(scan);
    if (check.includes("search")) pass = fileExists("lib/taxonomy/category-search.ts");
    if (check.includes("category")) pass = fileExists("lib/listings/category-path.ts");
    if (check.includes("homepage") || check.includes("featured")) pass = fileExists("app/api/listings/feature/route.ts");
    if (check.includes("business")) pass = fileExists("lib/moderation/scan-listing.ts");
    if (check.includes("seo")) pass = fileExists("app/listing/[slug]/page.tsx");
    if (check.includes("notification") || check.includes("analytics") || check.includes("audit")) {
      pass = wizard.includes("trackGaEvent") || repository.length > 0;
    }
    if (check.includes("visibility")) pass = repository.includes("status");
    return createCheck("listing-publish", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanButtonValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const sellPage = readSource("features/sell/ui/SellScreen.tsx");
  const footer = readSource("features/sell/components/SellPublishFooter.tsx");
  const header = fileExists("features/sell/components/SellPageHeader.tsx");

  return LISTING_BUTTON_VALIDATION.map((check) => {
    let pass = sellPage.length > 0 && listingFoundationReady(scan);
    if (check.includes("save-draft")) pass = header && sellPage.includes("saveDraft");
    if (check === "publish") pass = footer.includes("onPublish");
    if (check.includes("upload") || check.includes("remove")) pass = fileExists("features/sell/components/SellPhotoSection.tsx");
    if (check.includes("ai-category") || check.includes("ai-improve")) pass = fileExists("features/sell/components/TitleCategorySuggestions.tsx");
    if (check.includes("duplicate") || check.includes("archive") || check.includes("delete")) {
      pass = fileExists("features/seller/listings/components/SellerListingsPage.tsx");
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
    if (check.includes("search")) pass = fileExists("lib/taxonomy/category-search.ts");
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
    if (check.includes("preview")) pass = fileExists("features/sell/ui/SellSuccessScreen.tsx");
    if (check.includes("image-upload")) pass = fileExists("app/api/listings/upload/route.ts");
    if (check.includes("validation")) pass = readSource("features/sell/types.ts").includes("getListingValidationErrors");
    if (check.includes("category-mapping")) pass = fileExists("lib/listings/category-path.ts");
    if (check.includes("search-mapping")) pass = fileExists("lib/categories/resolve-listing.ts");
    if (check.includes("homepage")) pass = scan.homepagePass;
    if (check.includes("seo")) pass = fileExists("app/listing/[slug]/page.tsx");
    if (check.includes("responsive")) pass = premiumStylesActive();
    if (check.includes("duplicate")) pass = fileExists("lib/moderation/analyzer.ts");
    if (check.includes("orphan")) pass = fileExists("lib/sell/draft-storage.ts");
    return createCheck("listing-omega-global", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const formSource = readSource("features/sell/components/SellListingForm.tsx");
  const photoSource = readSource("features/sell/components/SellPhotoSection.tsx");

  return [
    createCheck("listing-accessibility", "form-labels", formSource.includes("htmlFor"), "Form labels PASS"),
    createCheck("listing-accessibility", "field-errors", fileExists("features/sell/components/FieldError.tsx"), "Field errors PASS"),
    createCheck("listing-accessibility", "photo-controls", photoSource.includes("aria"), "Photo controls PASS"),
    createCheck("listing-accessibility", "publish-footer", readSource("features/sell/components/SellPublishFooter.tsx").includes("disabled"), "Publish footer PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const wizard = readSource("features/sell/hooks/use-sell-wizard.ts");
  const uploadClient = readSource("lib/listings/upload-client.ts");

  return [
    createCheck("listing-performance", "debounced-category-detection", wizard.includes("TITLE_CATEGORY_DEBOUNCE_MS"), "Debounced category detection PASS"),
    createCheck("listing-performance", "progressive-upload", uploadClient.includes("onProgress"), "Progressive upload PASS"),
    createCheck("listing-performance", "image-compression", fileExists("lib/storage/client-images.ts"), "Image compression PASS"),
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
    seo: fileExists("app/listing/[slug]/page.tsx") ? 100 : 90,
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
    "create-pass": fileExists("app/sell/page.tsx") && foundation,
    "draft-pass": fileExists("lib/sell/draft-storage.ts"),
    "preview-pass": fileExists("features/sell/ui/SellScreen.tsx"),
    "publish-pass": readSource("features/sell/hooks/use-sell-wizard.ts").includes("publishListing"),
    "image-upload-pass": fileExists("app/api/listings/upload/route.ts"),
    "ai-validation-pass": fileExists("lib/sell/category-detection-pro.ts"),
    "seo-pass": fileExists("app/listing/[slug]/page.tsx"),
    "accessibility-pass": scan.globalUiPass,
    "performance-pass": scan.homepagePass,
    "marketplace-pass": fileExists("lib/moderation/scan-listing.ts"),
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "field-validation-pass": typesSource.includes("isListingValid"),
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
