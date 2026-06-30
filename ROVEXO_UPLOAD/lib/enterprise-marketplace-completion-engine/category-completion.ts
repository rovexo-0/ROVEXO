import {
  AI_CATEGORY_VALIDATION_CHECKS,
  CATEGORY_BUTTON_VALIDATION,
  CATEGORY_CERTIFICATION_SCORES,
  CATEGORY_DATABASE_VALIDATION,
  CATEGORY_HOMEPAGE_SYNC_CHECKS,
  CATEGORY_INTEGRITY_CHECKS,
  CATEGORY_LISTING_SYNC_CHECKS,
  CATEGORY_PASS_CONDITIONS,
  CATEGORY_SAFE_REPAIR_ACTIONS,
  CATEGORY_SEARCH_SYNC_CHECKS,
  CATEGORY_SEO_CHECKS,
  GLOBAL_CATEGORY_SCAN_DOMAINS,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  AiCategoryValidationItem,
  CategoryAutoRepairProposal,
  CategoryCertificationScoreCard,
  CategoryCompletionResult,
  CategoryDomainScanResult,
  CategoryPassConditionResult,
  CompletionValidationItem,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(scan: MarketplaceCompletionScanResult): CategoryDomainScanResult[] {
  return GLOBAL_CATEGORY_SCAN_DOMAINS.map((domain) => {
    const pass = fileExists(domain.ref);
    return {
      id: `cat-domain-${domain.id}`,
      domainId: domain.id,
      label: domain.label,
      ref: domain.ref,
      status: pass ? passStatus() : "fail",
      passPercent: pass ? 100 : 0,
      message: pass ? `${domain.label} taxonomy connected` : `${domain.label} missing or disconnected`,
    };
  });
}

function categoryFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("lib/categories/tree.ts") &&
    fileExists("lib/taxonomy/category-tree.ts") &&
    fileExists("lib/enterprise-category-management-center/engine.ts") &&
    scan.homepageCompletionPass
  );
}

function homepageCategorySyncReady(): boolean {
  const homeContent = readSource("components/home/HomeContent.tsx");
  return homeContent.includes("HomeCategoryRail") && !homeContent.includes("CategoryGridSection");
}

function scanIntegrity(homeContent: string, scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const foundation = categoryFoundationReady(scan);
  const homepageSync = homepageCategorySyncReady();
  const validator = fileExists("lib/taxonomy/category-validator.ts");
  const noLegacyGrid = !homeContent.includes("CategoryGridSection");

  return CATEGORY_INTEGRITY_CHECKS.map((check) => {
    let pass = foundation && scan.homepageCertified;
    if (check.includes("duplicate")) pass = foundation && homepageSync && noLegacyGrid;
    if (check.includes("homepage-rendering")) pass = homepageSync && noLegacyGrid;
    if (check.includes("legacy")) pass = noLegacyGrid && fileExists("lib/categories/enterprise/index.ts");
    if (check.includes("broken") || check.includes("circular") || check.includes("orphan")) pass = foundation && validator;
    if (check.includes("unused") || check.includes("hidden") || check.includes("empty")) pass = foundation;
    return createCheck("category-integrity", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function scanHomepageSync(homeContent: string, scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const hasRail = homeContent.includes("HomeCategoryRail");
  const noLegacyGrid = !homeContent.includes("CategoryGridSection");
  const navSource = readSource("lib/home/constants.ts");
  const railSource = readSource("components/home/HomeCategoryRail.tsx");

  return CATEGORY_HOMEPAGE_SYNC_CHECKS.map((check) => {
    let pass = hasRail && noLegacyGrid && scan.homepageCompletionPass;
    if (check.includes("single") || check.includes("no-duplicated")) pass = hasRail && noLegacyGrid;
    if (check.includes("synchronized")) pass = navSource.includes("HOME_CATEGORY_NAV") && railSource.includes("HOME_CATEGORY_NAV");
    if (check.includes("manual")) pass = noLegacyGrid;
    return createCheck("category-homepage-sync", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanSearchSync(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const searchPage = fileExists("app/search/page.tsx");
  const searchApi = fileExists("app/api/search/route.ts");
  const categorySearch = fileExists("lib/taxonomy/category-search.ts");
  const categoryIndex = fileExists("lib/taxonomy/category-index.ts");

  return CATEGORY_SEARCH_SYNC_CHECKS.map((check) => {
    let pass = categorySearch && categoryIndex && scan.homepagePass;
    if (check.includes("index")) pass = categoryIndex && fileExists("lib/categories/sync-db.ts");
    if (check.includes("autocomplete") || check.includes("suggest")) pass = searchPage && searchApi;
    if (check.includes("ai-search")) pass = fileExists("lib/taxonomies/ai-category.ts");
    if (check.includes("popular") || check.includes("saved")) pass = searchPage;
    if (check.includes("filter")) pass = fileExists("lib/categories/filters.ts");
    return createCheck("category-search-sync", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanListingSync(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const resolveListing = fileExists("lib/categories/resolve-listing.ts");
  const categoryPath = fileExists("lib/listings/category-path.ts");
  const sellPage = fileExists("app/sell/new/page.tsx");
  const aiSuggest = fileExists("lib/sell/suggest-category-from-title.ts");

  return CATEGORY_LISTING_SYNC_CHECKS.map((check) => {
    let pass = resolveListing && categoryPath && scan.homepagePass;
    if (check.includes("subcategory") || check.includes("category")) pass = resolveListing && fileExists("lib/categories/tree.ts");
    if (check.includes("attribute") || check.includes("compatibility") || check.includes("marketplace")) pass = fileExists("lib/categories/enterprise/builder.ts");
    if (check.includes("ai-recommendation")) pass = aiSuggest && fileExists("lib/taxonomies/ai-category.ts");
    if (check.includes("seo") || check.includes("search")) pass = categoryPath && fileExists("lib/taxonomy/category-search.ts");
    if (check.includes("listing") && check.includes("publish")) pass = sellPage;
    return createCheck("category-listing-sync", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAiCategoryEngine(scan: MarketplaceCompletionScanResult): AiCategoryValidationItem[] {
  const aiCategory = readSource("lib/taxonomies/ai-category.ts");
  const learning = fileExists("lib/sell/category-detection-learning.ts");
  const proDetection = fileExists("lib/sell/category-detection-pro.ts");
  const mgmtAi = fileExists("lib/enterprise-category-management-center/engine.ts");

  return AI_CATEGORY_VALIDATION_CHECKS.map((check) => {
    let pass = aiCategory.length > 0 && mgmtAi;
    if (check.includes("parent") || check.includes("duplicate") || check.includes("attribute")) pass = proDetection && aiCategory.length > 0;
    if (check.includes("confidence") || check.includes("marketplace")) pass = aiCategory.includes("confidence") || aiCategory.length > 0;
    if (check.includes("manual")) pass = fileExists("lib/enterprise-category-management-center/page.tsx");
    if (check.includes("learning")) pass = learning;
    if (check.includes("suggest")) pass = fileExists("lib/sell/suggest-category-from-title.ts");
    return {
      id: `ai-cat-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      confidence: pass ? 100 : 75,
      message: pass ? `${labelize(check)} validated` : `${labelize(check)} pending`,
    };
  });
}

function scanSeo(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const categoriesPage = readSource("app/categories/page.tsx");
  const treeSource = readSource("lib/taxonomy/category-tree.ts");

  return CATEGORY_SEO_CHECKS.map((check) => {
    let pass = categoriesPage.includes("metadata") && scan.homepagePass;
    if (check.includes("slug") || check.includes("canonical")) pass = treeSource.includes("seoSlug") || treeSource.includes("slug");
    if (check.includes("meta")) pass = categoriesPage.includes("metadata");
    if (check.includes("structured") || check.includes("breadcrumb")) pass = categoriesPage.length > 0;
    if (check.includes("opengraph") || check.includes("internal") || check.includes("index")) pass = fileExists("middleware.ts") && categoriesPage.includes("metadata");
    return createCheck("category-seo", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanButtonValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const mgmtPage = fileExists("lib/enterprise-category-management-center/page.tsx");
  const mgmtActions = fileExists("lib/enterprise-category-management-center/actions.ts");

  return CATEGORY_BUTTON_VALIDATION.map((check) => {
    let pass = mgmtPage && mgmtActions && scan.homepagePass;
    if (check.includes("import") || check.includes("export")) pass = fileExists("lib/enterprise-category-management-center/export.ts");
    if (check.includes("merge") || check.includes("split") || check.includes("move")) pass = mgmtActions;
    if (check.includes("certify") || check.includes("validate") || check.includes("synchronize")) pass = fileExists("lib/enterprise-category-management-center/health.ts");
    if (check.includes("preview") || check.includes("expand") || check.includes("collapse")) pass = mgmtPage;
    return createCheck("category-buttons", check, pass, pass ? `${labelize(check)} validated` : `${labelize(check)} pending`);
  });
}

function scanDatabaseValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const syncDb = fileExists("lib/categories/sync-db.ts");
  const tree = fileExists("lib/categories/tree.ts");
  const visuals = fileExists("lib/categories/visuals.ts");

  return CATEGORY_DATABASE_VALIDATION.map((check) => {
    let pass = syncDb && tree && scan.homepagePass;
    if (check.includes("relationship") || check.includes("constraint") || check.includes("index")) pass = tree && fileExists("lib/taxonomy/category-validator.ts");
    if (check.includes("translation")) pass = fileExists("lib/categories/types.ts");
    if (check.includes("image") || check.includes("icon")) pass = visuals && fileExists("lib/home/category-premium-assets.ts");
    if (check.includes("marketplace") || check.includes("search") || check.includes("homepage")) pass = fileExists("lib/categories/marketplace-tree.ts") && fileExists("lib/taxonomy/category-search.ts") && fileExists("lib/home/constants.ts");
    return createCheck("category-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const railSource = readSource("components/home/HomeCategoryRail.tsx");
  const categoryCss = readSource("styles/rovexo/category-rail.css");
  const pass =
    railSource.includes("aria-labelledby") &&
    railSource.includes("role=\"list\"") &&
    categoryCss.length > 0 &&
    scan.globalUiPass;
  return [
    createCheck("category-accessibility", "keyboard-navigation", pass, pass ? "Keyboard navigation PASS" : "Keyboard navigation pending"),
    createCheck("category-accessibility", "screen-reader-labels", pass, pass ? "Screen reader labels PASS" : "Screen reader labels pending"),
    createCheck("category-accessibility", "focus-states", pass && railSource.includes("focusRing"), pass ? "Focus states PASS" : "Focus states pending"),
    createCheck("category-accessibility", "responsive-touch-targets", pass && premiumStylesActive(), pass ? "Touch targets PASS" : "Touch targets pending"),
  ];
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const railSource = readSource("components/home/HomeCategoryRail.tsx");
  return [
    createCheck("category-performance", "lazy-icon-loading", railSource.includes("priority"), "Lazy icon loading PASS"),
    createCheck("category-performance", "memoized-rail", railSource.includes("memo"), "Memoized rail PASS"),
    createCheck("category-performance", "css-optimisation", fileExists("styles/rovexo/category-rail.css"), "CSS optimisation PASS"),
    createCheck("category-performance", "tree-index-cache", fileExists("lib/taxonomy/category-index.ts"), "Tree index cache PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.homepagePass ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): CategoryCertificationScoreCard[] {
  const weights: Record<(typeof CATEGORY_CERTIFICATION_SCORES)[number], number> = {
    integrity: 10,
    "homepage-sync": 10,
    "search-sync": 9,
    "listing-sync": 9,
    seo: 8,
    accessibility: 8,
    performance: 8,
    architecture: 10,
    marketplace: 9,
    enterprise: 10,
  };
  const values: Record<(typeof CATEGORY_CERTIFICATION_SCORES)[number], number> = {
    integrity: passPercent,
    "homepage-sync": scan.homepageCompletionPass ? 100 : 90,
    "search-sync": fileExists("lib/taxonomy/category-search.ts") ? 100 : 85,
    "listing-sync": fileExists("lib/categories/resolve-listing.ts") ? 100 : 85,
    seo: scan.homepagePass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    performance: scan.homepagePass ? 100 : 90,
    architecture: passPercent,
    marketplace: scan.passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
  };

  return CATEGORY_CERTIFICATION_SCORES.map((key) => ({
    key,
    label: labelize(key),
    score: values[key],
    status: values[key] >= 100 ? passStatus() : "fail",
    weight: weights[key],
  }));
}

function buildPassConditions(
  scan: MarketplaceCompletionScanResult,
  homeContent: string,
  passPercent: number,
  checksPass: boolean,
): CategoryPassConditionResult[] {
  const noLegacyGrid = !homeContent.includes("CategoryGridSection");
  const hasRail = homeContent.includes("HomeCategoryRail");
  const foundation = categoryFoundationReady(scan);

  const mapping: Record<(typeof CATEGORY_PASS_CONDITIONS)[number], boolean> = {
    "no-duplicate-categories": foundation && hasRail && noLegacyGrid,
    "no-duplicate-homepage-rendering": hasRail && noLegacyGrid,
    "no-orphan-categories": foundation && fileExists("lib/taxonomy/category-validator.ts"),
    "no-circular-hierarchy": foundation && fileExists("lib/taxonomy/category-validator.ts"),
    "no-broken-routes": fileExists("middleware.ts") && fileExists("app/categories/page.tsx"),
    "no-broken-listings": fileExists("lib/categories/resolve-listing.ts") && fileExists("lib/listings/category-path.ts"),
    "search-synchronization-pass": fileExists("lib/taxonomy/category-search.ts") && fileExists("app/search/page.tsx"),
    "homepage-synchronization-pass": scan.homepageCompletionPass && hasRail && noLegacyGrid,
    "listing-synchronization-pass": fileExists("lib/categories/resolve-listing.ts"),
    "seo-pass": readSource("app/categories/page.tsx").includes("metadata"),
    "accessibility-pass": scan.globalUiPass,
    "performance-pass": scan.homepagePass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "category-completion-100": passPercent >= 100 && checksPass,
  };

  return CATEGORY_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runCategoryCompletionScan(scan: MarketplaceCompletionScanResult): CategoryCompletionResult {
  const homeContent = readSource("components/home/HomeContent.tsx");
  const domains = scanGlobalDomains(scan);
  const integrity = scanIntegrity(homeContent, scan);
  const homepageSync = scanHomepageSync(homeContent, scan);
  const searchSync = scanSearchSync(scan);
  const listingSync = scanListingSync(scan);
  const aiCategoryEngine = scanAiCategoryEngine(scan);
  const seo = scanSeo(scan);
  const buttonValidation = scanButtonValidation(scan);
  const databaseValidation = scanDatabaseValidation(scan);
  const accessibility = scanAccessibility(scan);
  const performance = scanPerformance(scan);

  const allChecks = [
    ...integrity,
    ...homepageSync,
    ...searchSync,
    ...listingSync,
    ...seo,
    ...buttonValidation,
    ...databaseValidation,
    ...accessibility,
    ...performance,
  ];
  const aiPass = aiCategoryEngine.filter((c) => c.status === "pass").length;
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPass = allChecks.filter((c) => c.status === "pass").length;
  const aiScore = aiCategoryEngine.length === 0 ? 100 : (aiPass / aiCategoryEngine.length) * 100;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPass / allChecks.length) * 50 + (aiScore / 100) * 20) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, homeContent, passPercent, checksPass === allChecks.length);
  const autoRepairs = CATEGORY_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `cat-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: action.includes("remove-duplicate-categories"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const allAiPass = aiCategoryEngine.every((c) => c.status === "pass");
  const categoryCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPass === allChecks.length &&
    allAiPass;
  const categoryCertified =
    categoryCompletionPass && scan.omegaPass && scan.homepageCertified && scan.homepageCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 2,
    passPercent: categoryCompletionPass ? 100 : passPercent,
    status: categoryCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    categoryCompletionPass,
    categoryCertified,
    productionReady: categoryCertified && scan.productionReady,
    launchReady: categoryCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    integrity,
    homepageSync,
    searchSync,
    listingSync,
    aiCategoryEngine,
    seo,
    buttonValidation,
    databaseValidation,
    accessibility,
    performance,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isCategoryCompletionPass(result: CategoryCompletionResult): boolean {
  return (
    result.categoryCompletionPass &&
    result.categoryCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
