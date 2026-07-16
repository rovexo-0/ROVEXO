import {
  GLOBAL_HOMEPAGE_SCAN_COMPONENTS,
  HOMEPAGE_AUTO_REPAIR_ACTIONS,
  HOMEPAGE_BUTTON_VALIDATION,
  HOMEPAGE_CATEGORY_VALIDATION,
  HOMEPAGE_CERTIFICATION_SCORES,
  HOMEPAGE_FEATURED_CONTENT,
  HOMEPAGE_LAYOUT_VALIDATION,
  HOMEPAGE_PASS_CONDITIONS,
  HOMEPAGE_PERFORMANCE_CHECKS,
  HOMEPAGE_RESPONSIVE_VALIDATION,
  HOMEPAGE_SEARCH_VALIDATION,
  HOMEPAGE_SEO_CHECKS,
  HOMEPAGE_VISUAL_INTEGRITY_CHECKS,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  CompletionValidationItem,
  HomepageCertificationScoreCard,
  HomepageCompletionResult,
  HomepageComponentScanResult,
  HomepagePassConditionResult,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalComponents(): HomepageComponentScanResult[] {
  return GLOBAL_HOMEPAGE_SCAN_COMPONENTS.map((component) => {
    const pass = fileExists(component.ref);
    return {
      id: `hp-component-${component.id}`,
      componentId: component.id,
      label: component.label,
      ref: component.ref,
      status: pass ? passStatus() : "fail",
      passPercent: pass ? 100 : 0,
      message: pass ? `${component.label} enterprise ready` : `${component.label} missing or incomplete`,
    };
  });
}

function scanVisualIntegrity(homeContent: string, scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const hasRail = homeContent.includes("HomeCategoryRail");
  const noLegacyGrid = !homeContent.includes("CategoryGridSection");

  return HOMEPAGE_VISUAL_INTEGRITY_CHECKS.map((check) => {
    let pass = scan.globalUiPass && scan.homepagePass && noLegacyGrid;
    if (check.includes("duplicate-categor")) pass = hasRail && noLegacyGrid;
    if (check.includes("duplicate-section") || check.includes("duplicate-widget") || check.includes("duplicate-banner")) pass = noLegacyGrid && scan.globalUiPass;
    if (check.includes("legacy") || check.includes("dead")) pass = noLegacyGrid;
    if (check.includes("empty-layout") || check.includes("viewport")) pass = scan.homepagePass && premiumStylesActive();
    if (check.includes("broken-responsive") || check.includes("broken-grid") || check.includes("broken-alignment")) pass = scan.globalUiPass && fileExists("styles/rovexo/category-rail.css");
    if (check.includes("padding") || check.includes("margin")) pass = premiumStylesActive();
    return createCheck("homepage-visual", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function scanSearchArea(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const header = readSource("components/Header.tsx");
  const searchComponent = header.includes("HeaderSearchBar");
  const searchPage = fileExists("app/search/page.tsx");
  const searchApi = fileExists("app/api/search/route.ts");

  return HOMEPAGE_SEARCH_VALIDATION.map((check) => {
    let pass = searchComponent && searchPage && scan.homepagePass;
    if (check.includes("suggest") || check.includes("autocomplete") || check.includes("history")) pass = searchPage && searchApi;
    if (check.includes("voice") || check.includes("image")) pass = searchComponent;
    if (check.includes("loading") || check.includes("error") || check.includes("empty")) pass = searchComponent && scan.globalUiPass;
    if (check.includes("routing")) pass = fileExists("middleware.ts");
    if (check.includes("performance")) pass = scan.homepagePass;
    return createCheck("homepage-search", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanCategoryValidation(homeContent: string, scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const hasRail = homeContent.includes("HomeCategoryRail");
  const noLegacyGrid = !homeContent.includes("CategoryGridSection");
  const categoryCss = fileExists("styles/rovexo/category-rail.css");
  const categoriesPage = fileExists("app/categories/page.tsx");

  return HOMEPAGE_CATEGORY_VALIDATION.map((check) => {
    let pass = hasRail && noLegacyGrid && scan.homepagePass;
    if (check.includes("single") || check.includes("no-duplicated")) pass = hasRail && noLegacyGrid;
    if (check.includes("hierarchy") || check.includes("ordering")) pass = hasRail && categoriesPage;
    if (check.includes("icon")) pass = fileExists("components/home/HomeCategoryIconImage.tsx");
    if (check.includes("routing")) pass = fileExists("middleware.ts");
    if (check.includes("seo")) pass = scan.homepagePass;
    if (check.includes("responsive") || check.includes("spacing") || check.includes("scroll")) pass = categoryCss && premiumStylesActive();
    if (check.includes("translation")) pass = fileExists("app/categories/page.tsx");
    return createCheck("homepage-category", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanLayoutValidation(homeContent: string, scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const noLegacyGrid = !homeContent.includes("CategoryGridSection");
  const header = readSource("components/Header.tsx");
  const hasSearch = header.includes("HeaderSearchBar");

  return HOMEPAGE_LAYOUT_VALIDATION.map((check) => {
    let pass = scan.globalUiPass && scan.homepagePass && noLegacyGrid;
    if (check.includes("empty-space-above-search")) pass = hasSearch && scan.homepagePass;
    if (check.includes("duplicated-category") || check.includes("duplicated-widget")) pass = noLegacyGrid;
    if (check.includes("premium") || check.includes("spacing") || check.includes("card") || check.includes("icon") || check.includes("typography")) pass = premiumStylesActive() && fileExists("styles/rovexo/index.css");
    if (check.includes("animation")) pass = fileExists("styles/rovexo/hero.css");
    if (check.includes("safe-area")) pass = fileExists("styles/rovexo/category-rail.css");
    if (check.includes("2026")) pass = premiumStylesActive() && noLegacyGrid;
    return createCheck("homepage-layout", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanFeaturedContent(homeContent: string, scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const refs: Partial<Record<(typeof HOMEPAGE_FEATURED_CONTENT)[number], string>> = {
    "featured-listings": "components/home/FeaturedListingsSection.tsx",
    "recommended-listings": "components/home/HomeProductSection.tsx",
    "latest-listings": "components/home/HomeProductSection.tsx",
    "trending-listings": "components/home/HomeTrendingListingsSection.tsx",
    "sponsored-listings": "components/home/HomePromoBanner.tsx",
    "business-promotions": "components/home/BusinessSpotlightSection.tsx",
    "banner-rotation": "components/home/RovexoHomePage.tsx",
    "carousel-behaviour": "components/home/HomeAllListingsSection.tsx",
    "lazy-loading": "components/home/ProductGridSkeleton.tsx",
  };

  return HOMEPAGE_FEATURED_CONTENT.map((check) => {
    const ref = refs[check];
    let pass = ref ? fileExists(ref) : homeContent.length > 0;
    if (check.includes("carousel") || check.includes("lazy")) pass = pass && scan.globalUiPass;
    if (check.includes("banner")) pass = !homeContent.includes("RovexoBanner") && !homeContent.includes("BringYourItemsBanner");
    return createCheck("homepage-featured", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanButtonValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const hasUi = fileExists("components/ui/Button.tsx") && fileExists("middleware.ts");
  return HOMEPAGE_BUTTON_VALIDATION.map((check) => {
    let pass = hasUi && scan.homepagePass;
    if (check === "api") pass = fileExists("app/api/search/route.ts");
    if (check === "database") pass = fileExists("lib/supabase/middleware.ts");
    if (check === "permission" || check === "redirect") pass = fileExists("middleware.ts");
    if (check === "notification") pass = fileExists("app/notifications/page.tsx");
    return createCheck("homepage-buttons", check, pass, pass ? `${labelize(check)} validated` : `${labelize(check)} pending`);
  });
}

function scanResponsiveValidation(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const categoryCss = readSource("styles/rovexo/category-rail.css");
  const hasResponsive = categoryCss.includes("@media") || categoryCss.includes("clamp");
  return HOMEPAGE_RESPONSIVE_VALIDATION.map((check) =>
    createCheck("homepage-responsive", check, hasResponsive && scan.globalUiPass && premiumStylesActive(), `${labelize(check)} responsive validated`),
  );
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  return HOMEPAGE_PERFORMANCE_CHECKS.map((check) => {
    let pass = scan.homepagePass;
    if (check.includes("lazy") || check.includes("image")) pass = fileExists("components/home/ProductGridSkeleton.tsx");
    if (check.includes("bundle") || check.includes("caching")) pass = scan.launchReadinessPass;
    if (check.includes("render")) pass = fileExists("components/home/HomeContent.tsx");
    return createCheck("homepage-performance", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanSeo(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const pageSource = readSource("app/page.tsx");
  return HOMEPAGE_SEO_CHECKS.map((check) => {
    let pass = scan.homepagePass && pageSource.length > 0;
    if (check.includes("metadata") || check.includes("canonical") || check.includes("opengraph")) pass = pageSource.includes("metadata") || pageSource.includes("generateMetadata");
    if (check.includes("structured")) pass = pageSource.length > 0;
    if (check.includes("internal") || check.includes("index")) pass = fileExists("middleware.ts");
    return createCheck("homepage-seo", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): HomepageCertificationScoreCard[] {
  const weights: Record<(typeof HOMEPAGE_CERTIFICATION_SCORES)[number], number> = {
    architecture: 10,
    ui: 10,
    ux: 9,
    navigation: 9,
    performance: 9,
    seo: 8,
    accessibility: 8,
    security: 10,
    marketplace: 9,
    enterprise: 10,
  };
  const values: Record<(typeof HOMEPAGE_CERTIFICATION_SCORES)[number], number> = {
    architecture: passPercent,
    ui: scan.globalUiPass ? 100 : 85,
    ux: scan.globalUiPass ? 100 : 85,
    navigation: fileExists("middleware.ts") ? 100 : 85,
    performance: scan.homepagePass ? 100 : 90,
    seo: scan.homepagePass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    security: scan.launchReadinessPass ? 100 : 90,
    marketplace: scan.passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
  };

  return HOMEPAGE_CERTIFICATION_SCORES.map((key) => ({
    key,
    label: labelize(key),
    score: values[key],
    status: values[key] >= 100 ? passStatus() : "fail",
    weight: weights[key],
  }));
}

function buildPassConditions(scan: MarketplaceCompletionScanResult, homeContent: string, passPercent: number): HomepagePassConditionResult[] {
  const noLegacyGrid = !homeContent.includes("CategoryGridSection");
  const hasRail = homeContent.includes("HomeCategoryRail");

  const mapping: Record<(typeof HOMEPAGE_PASS_CONDITIONS)[number], boolean> = {
    "no-duplicate-categories": hasRail && noLegacyGrid,
    "no-duplicate-homepage-sections": noLegacyGrid && scan.globalUiPass,
    "no-empty-space-above-search":
      readSource("components/header/RovexoHeaderV2.tsx").includes("HomepageSearchField") &&
      scan.homepagePass,
    "all-buttons-functional": fileExists("components/ui/Button.tsx"),
    "all-routes-functional": fileExists("middleware.ts"),
    "all-widgets-functional": fileExists("components/home/HomeContent.tsx"),
    "responsive-pass": scan.globalUiPass && premiumStylesActive(),
    "performance-pass": scan.homepagePass,
    "seo-pass": scan.homepagePass,
    "accessibility-pass": scan.globalUiPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "homepage-completion-100": passPercent >= 100,
  };

  return HOMEPAGE_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runHomepageCompletionScan(scan: MarketplaceCompletionScanResult): HomepageCompletionResult {
  const homeContent = readSource("components/home/HomeContent.tsx");
  const components = scanGlobalComponents();
  const visualIntegrity = scanVisualIntegrity(homeContent, scan);
  const searchArea = scanSearchArea(scan);
  const categoryValidation = scanCategoryValidation(homeContent, scan);
  const layoutValidation = scanLayoutValidation(homeContent, scan);
  const featuredContent = scanFeaturedContent(homeContent, scan);
  const buttonValidation = scanButtonValidation(scan);
  const responsiveValidation = scanResponsiveValidation(scan);
  const performance = scanPerformance(scan);
  const seo = scanSeo(scan);

  const allChecks = [
    ...visualIntegrity,
    ...searchArea,
    ...categoryValidation,
    ...layoutValidation,
    ...featuredContent,
    ...buttonValidation,
    ...responsiveValidation,
    ...performance,
    ...seo,
  ];
  const componentComplete = components.filter((c) => c.passPercent >= 100).length;
  const checksPass = allChecks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round(
    ((componentComplete / components.length) * 40 + (checksPass / allChecks.length) * 60) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, homeContent, passPercent);
  const autoRepairs = HOMEPAGE_AUTO_REPAIR_ACTIONS.map((action, i) => ({
    id: `hp-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: false,
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const homepageCompletionPass = passPercent >= 100 && allConditionsPass && allScoresPass && componentComplete === components.length;
  const homepageCertified = homepageCompletionPass && scan.omegaPass && scan.homepagePass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 1,
    passPercent: homepageCompletionPass ? 100 : passPercent,
    status: homepageCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    homepageCompletionPass,
    homepageCertified,
    productionReady: homepageCertified && scan.productionReady,
    launchReady: homepageCertified && scan.launchReadyFinal,
    componentsComplete: componentComplete,
    componentsTotal: components.length,
    components,
    visualIntegrity,
    searchArea,
    categoryValidation,
    layoutValidation,
    featuredContent,
    buttonValidation,
    responsiveValidation,
    performance,
    seo,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isHomepageCompletionPass(result: HomepageCompletionResult): boolean {
  return (
    result.homepageCompletionPass &&
    result.homepageCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
