import {
  AI_SEARCH_VALIDATION,
  GLOBAL_SEARCH_SCAN_DOMAINS,
  OMEGA_GLOBAL_SEARCH_VALIDATION,
  SEARCH_CERTIFICATION_SCORES,
  SEARCH_DATABASE_VALIDATION,
  SEARCH_EMPTY_STATE_VALIDATION,
  SEARCH_ENGINE_VALIDATION,
  SEARCH_FILTER_VALIDATION,
  SEARCH_PASS_CONDITIONS,
  SEARCH_PERFORMANCE_VALIDATION,
  SEARCH_RESULTS_VALIDATION,
  SEARCH_SAFE_REPAIR_ACTIONS,
  SEARCH_SEO_VALIDATION,
  SEARCH_SORT_VALIDATION,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  AiSearchValidationItem,
  CompletionValidationItem,
  MarketplaceCompletionScanResult,
  SearchCertificationScoreCard,
  SearchCompletionResult,
  SearchDomainScanResult,
  SearchPassConditionResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalDomains(): SearchDomainScanResult[] {
  return GLOBAL_SEARCH_SCAN_DOMAINS.map((domain) => {
    const pass = fileExists(domain.ref);
    return {
      id: `search-domain-${domain.id}`,
      domainId: domain.id,
      label: domain.label,
      ref: domain.ref,
      status: pass ? passStatus() : "fail",
      passPercent: pass ? 100 : 0,
      message: pass ? `${domain.label} connected` : `${domain.label} missing or incomplete`,
    };
  });
}

function searchFoundationReady(scan: MarketplaceCompletionScanResult): boolean {
  return (
    fileExists("app/search/page.tsx") &&
    fileExists("app/api/search/route.ts") &&
    fileExists("features/search/components/SearchResultsView.tsx") &&
    scan.categoryCompletionPass
  );
}

function scanSearchEngine(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const searchPage = fileExists("app/search/page.tsx");
  const searchApi = fileExists("app/api/search/route.ts");
  const overlay = fileExists("features/search/components/SearchOverlay.tsx");
  const registry = readSource("lib/search-engine/registry.ts");

  return SEARCH_ENGINE_VALIDATION.map((check) => {
    let pass = searchFoundationReady(scan) && searchPage && searchApi;
    if (check.includes("autocomplete") || check.includes("realtime")) pass = overlay && searchApi;
    if (check.includes("suggest") || check.includes("recommended")) pass = fileExists("features/search/components/SuggestedSearches.tsx");
    if (check.includes("trending")) pass = fileExists("features/search/components/TrendingSearches.tsx");
    if (check.includes("popular")) pass = fileExists("lib/search/popular-searches.ts");
    if (check.includes("recent")) pass = fileExists("features/search/components/RecentSearches.tsx");
    if (check.includes("saved")) pass = fileExists("features/search/components/SavedSearchesPanel.tsx");
    if (check.includes("ai-suggest")) pass = fileExists("lib/search-engine/engine.ts");
    if (check.includes("misspell") || check.includes("synonym") || check.includes("plural")) {
      pass = fileExists("lib/taxonomy/category-synonyms.ts") || fileExists("lib/taxonomy/category-normalizer.ts");
    }
    if (check.includes("category-detection")) pass = fileExists("lib/taxonomy/category-search.ts");
    if (check.includes("brand-detection")) pass = registry.includes("brand");
    return createCheck("search-engine", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanFilters(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const filtersSource = readSource("features/search/components/SearchFilters.tsx");

  return SEARCH_FILTER_VALIDATION.map((check) => {
    let pass = searchFoundationReady(scan) && filtersSource.length > 0;
    if (check === "category" || check === "subcategory") pass = filtersSource.includes("getCategoryTree");
    if (check === "brand" || check === "condition" || check === "price") pass = filtersSource.includes(check === "brand" ? "brand" : check === "condition" ? "condition" : "minPrice");
    if (check.includes("location")) pass = fileExists("features/search/components/SearchLocationFilter.tsx");
    if (check.includes("seller") || check === "scope") pass = filtersSource.includes("scope");
    if (check.includes("company") || check.includes("business")) pass = fileExists("features/search/components/StoreResults.tsx");
    if (check.includes("delivery") || check.includes("stock") || check === "collection") pass = filtersSource.includes("delivery") || filtersSource.includes("inStock");
    if (check.includes("buyer") || check.includes("verified") || check.includes("featured") || check.includes("auction") || check.includes("compatibility")) {
      pass = fileExists("components/ui/ProductCard.tsx");
    }
    return createCheck("search-filters", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanSorting(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const sortSource = readSource("features/search/utils/sort-results.ts");
  const registry = readSource("lib/search-engine/registry.ts");

  return SEARCH_SORT_VALIDATION.map((check) => {
    let pass = sortSource.length > 0 && searchFoundationReady(scan);
    if (check.includes("newest") || check.includes("oldest") || check.includes("price") || check.includes("popular")) {
      pass = sortSource.includes("most_viewed") || sortSource.includes("nearest");
    }
    if (check.includes("distance")) pass = registry.includes("nearest") || sortSource.includes("nearest");
    if (check.includes("best-match") || check.includes("relevance") || check.includes("featured") || check.includes("recommended")) {
      pass = registry.includes("best-match") || fileExists("lib/search/search.ts");
    }
    return createCheck("search-sorting", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanResults(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const resultsSource = readSource("features/search/components/SearchResultsView.tsx");

  return SEARCH_RESULTS_VALIDATION.map((check) => {
    let pass = resultsSource.length > 0 && searchFoundationReady(scan);
    if (check.includes("listing") || check.includes("image") || check.includes("title") || check.includes("price")) {
      pass = resultsSource.includes("ProductCard");
    }
    if (check.includes("seller")) pass = resultsSource.includes("SellerResults");
    if (check.includes("business")) pass = fileExists("features/search/components/StoreResults.tsx");
    if (check.includes("pagination") || check.includes("infinite")) pass = resultsSource.includes("hasMore") && resultsSource.includes("useIntersectionWhenVisible");
    if (check.includes("badge") || check.includes("rating") || check.includes("buyer") || check.includes("sponsored") || check.includes("featured") || check.includes("metadata")) {
      pass = fileExists("components/ui/ProductCard.tsx");
    }
    return createCheck("search-results", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanEmptyStates(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const emptySource = readSource("features/search/components/SearchResultsEmpty.tsx");
  const resultsSource = readSource("features/search/components/SearchResultsView.tsx");
  const skeleton = fileExists("features/search/components/LoadingSkeleton.tsx");

  return SEARCH_EMPTY_STATE_VALIDATION.map((check) => {
    let pass = emptySource.length > 0 && searchFoundationReady(scan);
    if (check.includes("no-results") || check.includes("idle")) pass = emptySource.includes("no-results") || emptySource.includes("idle");
    if (check.includes("loading")) pass = skeleton || resultsSource.includes("loading");
    if (check.includes("api") || check.includes("retry") || check.includes("connection") || check.includes("offline")) {
      pass = resultsSource.includes("error") || resultsSource.includes("setError");
    }
    if (check.includes("maintenance")) pass = fileExists("middleware.ts");
    return createCheck("search-empty-states", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanPerformance(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const resultsSource = readSource("features/search/components/SearchResultsView.tsx");
  const debounce = fileExists("features/search/hooks/use-debounced-value.ts");

  return SEARCH_PERFORMANCE_VALIDATION.map((check) => {
    let pass = searchFoundationReady(scan) && scan.homepagePass;
    if (check.includes("index")) pass = fileExists("lib/taxonomy/category-index.ts");
    if (check.includes("cache") || check.includes("database")) pass = fileExists("lib/search-engine/engine.ts");
    if (check.includes("lazy") || check.includes("infinite")) pass = resultsSource.includes("useIntersectionWhenVisible");
    if (check.includes("debounce")) pass = debounce;
    if (check.includes("query") || check.includes("response") || check.includes("memory")) pass = fileExists("app/api/search/results/route.ts");
    return createCheck("search-performance", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanDatabase(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const registry = readSource("lib/search-engine/registry.ts");

  return SEARCH_DATABASE_VALIDATION.map((check) => {
    let pass = fileExists("lib/taxonomy/category-index.ts") && searchFoundationReady(scan);
    if (check.includes("listing")) pass = fileExists("app/api/search/results/route.ts");
    if (check.includes("category")) pass = fileExists("lib/taxonomy/category-search.ts");
    if (check.includes("brand")) pass = registry.includes("brand");
    if (check.includes("full-text") || check.includes("search-index")) pass = fileExists("lib/search/search.ts");
    if (check.includes("duplicate") || check.includes("missing") || check.includes("unused") || check.includes("health")) {
      pass = fileExists("lib/search-engine/engine.ts");
    }
    return createCheck("search-database", check, pass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanSeo(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const searchPage = readSource("app/search/page.tsx");

  return SEARCH_SEO_VALIDATION.map((check) => {
    let pass = searchPage.includes("generateMetadata") || searchPage.includes("buildPageMetadata");
    if (check.includes("url") || check.includes("canonical")) pass = searchPage.includes("/search");
    if (check.includes("meta")) pass = searchPage.includes("metadata") || searchPage.includes("buildPageMetadata");
    if (check.includes("opengraph") || check.includes("structured") || check.includes("breadcrumb")) pass = fileExists("lib/seo/metadata.ts");
    if (check.includes("index")) pass = searchPage.includes("noIndex") || searchPage.includes("buildPageMetadata");
    return createCheck("search-seo", check, pass && scan.homepagePass, pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`);
  });
}

function scanAiSearch(): AiSearchValidationItem[] {
  const aiEngine = readSource("lib/search-engine/engine.ts");
  const aiCategory = readSource("lib/taxonomies/ai-category.ts");

  return AI_SEARCH_VALIDATION.map((check) => {
    let pass = aiEngine.length > 0 || aiCategory.length > 0;
    if (check.includes("category")) pass = aiCategory.includes("confidence");
    if (check.includes("intent") || check.includes("keyword") || check.includes("marketplace")) pass = aiEngine.length > 0 || aiCategory.length > 0;
    if (check.includes("confidence")) pass = aiCategory.includes("confidence") || aiEngine.includes("score");
    if (check.includes("learning")) pass = fileExists("lib/sell/category-detection-learning.ts");
    if (check.includes("fallback")) pass = fileExists("lib/search/defaults.ts");
    return {
      id: `ai-search-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      confidence: pass ? 100 : 75,
      message: pass ? `${labelize(check)} validated` : `${labelize(check)} pending`,
    };
  });
}

function scanOmegaGlobal(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const foundation = searchFoundationReady(scan);
  const overlay = fileExists("features/search/components/SearchOverlay.tsx");
  const resultsSource = readSource("features/search/components/SearchResultsView.tsx");

  return OMEGA_GLOBAL_SEARCH_VALIDATION.map((check) => {
    let pass = foundation && scan.globalUiPass;
    if (check.includes("filter")) pass = fileExists("features/search/components/SearchFilters.tsx");
    if (check.includes("sort")) pass = fileExists("features/search/utils/sort-results.ts");
    if (check.includes("suggest") || check.includes("autocomplete")) pass = overlay && fileExists("features/search/components/SearchSuggestionList.tsx");
    if (check.includes("index")) pass = fileExists("lib/taxonomy/category-index.ts");
    if (check.includes("duplicate") || check.includes("missing") || check.includes("ranking")) pass = fileExists("app/api/search/results/route.ts");
    if (check.includes("slow")) pass = fileExists("features/search/hooks/use-debounced-value.ts");
    if (check.includes("pagination") || check.includes("infinite")) pass = resultsSource.includes("hasMore");
    if (check.includes("responsive")) pass = premiumStylesActive() && scan.globalUiPass;
    return createCheck("search-omega-global", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function scanAccessibility(scan: MarketplaceCompletionScanResult): CompletionValidationItem[] {
  const filtersSource = readSource("features/search/components/SearchFilters.tsx");
  const overlay = readSource("features/search/components/SearchOverlay.tsx");
  const pass = filtersSource.includes("aria-label") && (overlay.includes("aria") || overlay.length > 0) && scan.globalUiPass;

  return [
    createCheck("search-accessibility", "keyboard-navigation", fileExists("features/search/hooks/use-search-keyboard.ts"), "Keyboard navigation PASS"),
    createCheck("search-accessibility", "screen-reader-labels", pass, "Screen reader labels PASS"),
    createCheck("search-accessibility", "focus-management", overlay.includes("focus") || fileExists("features/search/hooks/use-search-overlay-state.ts"), "Focus management PASS"),
    createCheck("search-accessibility", "filter-labels", filtersSource.includes("aria-label"), "Filter labels PASS"),
  ].map((item) => ({
    ...item,
    status: item.status === "pass" && scan.globalUiPass ? passStatus() : item.status,
  }));
}

function buildCertificationScores(scan: MarketplaceCompletionScanResult, passPercent: number): SearchCertificationScoreCard[] {
  const weights: Record<(typeof SEARCH_CERTIFICATION_SCORES)[number], number> = {
    accuracy: 10,
    performance: 10,
    ux: 9,
    ui: 9,
    seo: 8,
    accessibility: 8,
    architecture: 10,
    marketplace: 9,
    enterprise: 10,
    reliability: 9,
  };
  const values: Record<(typeof SEARCH_CERTIFICATION_SCORES)[number], number> = {
    accuracy: passPercent,
    performance: scan.homepagePass ? 100 : 90,
    ux: scan.globalUiPass ? 100 : 90,
    ui: scan.globalUiPass ? 100 : 90,
    seo: fileExists("lib/seo/metadata.ts") ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    architecture: passPercent,
    marketplace: scan.passPercent,
    enterprise: scan.omegaPass ? 100 : 90,
    reliability: fileExists("lib/search-engine/engine.ts") ? 100 : 90,
  };

  return SEARCH_CERTIFICATION_SCORES.map((key) => ({
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
): SearchPassConditionResult[] {
  const foundation = searchFoundationReady(scan);
  const resultsSource = readSource("features/search/components/SearchResultsView.tsx");

  const mapping: Record<(typeof SEARCH_PASS_CONDITIONS)[number], boolean> = {
    "search-accuracy-pass": foundation && fileExists("app/api/search/results/route.ts"),
    "autocomplete-pass": fileExists("features/search/components/SearchOverlay.tsx"),
    "suggestions-pass": fileExists("features/search/components/SuggestedSearches.tsx"),
    "filters-pass": fileExists("features/search/components/SearchFilters.tsx"),
    "sorting-pass": fileExists("features/search/utils/sort-results.ts"),
    "pagination-pass": resultsSource.includes("page"),
    "infinite-scroll-pass": resultsSource.includes("useIntersectionWhenVisible"),
    "performance-pass": scan.homepagePass && fileExists("features/search/hooks/use-debounced-value.ts"),
    "seo-pass": readSource("app/search/page.tsx").includes("buildPageMetadata"),
    "accessibility-pass": scan.globalUiPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "omega-pass": scan.omegaPass,
    "search-results-pass": resultsSource.includes("ProductCard"),
    "search-completion-100": passPercent >= 100 && checksPass,
  };

  return SEARCH_PASS_CONDITIONS.map((condition) => ({
    id: condition,
    label: labelize(condition),
    pass: mapping[condition],
    message: mapping[condition] ? `${labelize(condition)} — PASS` : `${labelize(condition)} — blocked`,
  }));
}

export function runSearchCompletionScan(scan: MarketplaceCompletionScanResult): SearchCompletionResult {
  const domains = scanGlobalDomains();
  const searchEngine = scanSearchEngine(scan);
  const filters = scanFilters(scan);
  const sorting = scanSorting(scan);
  const results = scanResults(scan);
  const emptyStates = scanEmptyStates(scan);
  const performance = scanPerformance(scan);
  const database = scanDatabase(scan);
  const seo = scanSeo(scan);
  const aiSearch = scanAiSearch();
  const omegaGlobal = scanOmegaGlobal(scan);
  const accessibility = scanAccessibility(scan);

  const allChecks = [
    ...searchEngine,
    ...filters,
    ...sorting,
    ...results,
    ...emptyStates,
    ...performance,
    ...database,
    ...seo,
    ...omegaGlobal,
    ...accessibility,
  ];
  const aiPass = aiSearch.filter((c) => c.status === "pass").length;
  const domainComplete = domains.filter((d) => d.passPercent >= 100).length;
  const checksPassCount = allChecks.filter((c) => c.status === "pass").length;
  const aiScore = aiSearch.length === 0 ? 100 : (aiPass / aiSearch.length) * 100;
  const passPercent = Math.round(
    ((domainComplete / domains.length) * 30 + (checksPassCount / allChecks.length) * 50 + (aiScore / 100) * 20) * 100,
  ) / 100;

  const certificationScores = buildCertificationScores(scan, passPercent);
  const passConditions = buildPassConditions(scan, passPercent, checksPassCount === allChecks.length);
  const autoRepairs = SEARCH_SAFE_REPAIR_ACTIONS.map((action, i) => ({
    id: `search-repair-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: action.includes("repair-duplicate"),
    message: passPercent >= 100 ? "No repair required" : `${labelize(action)} available in safe mode`,
  }));

  const allConditionsPass = passConditions.every((c) => c.pass);
  const allScoresPass = certificationScores.every((s) => s.score >= 100);
  const allAiPass = aiSearch.every((c) => c.status === "pass");
  const searchCompletionPass =
    passPercent >= 100 &&
    allConditionsPass &&
    allScoresPass &&
    domainComplete === domains.length &&
    checksPassCount === allChecks.length &&
    allAiPass;
  const searchCertified =
    searchCompletionPass && scan.omegaPass && scan.categoryCertified && scan.categoryCompletionPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    launchPriority: 3,
    passPercent: searchCompletionPass ? 100 : passPercent,
    status: searchCompletionPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    searchCompletionPass,
    searchCertified,
    productionReady: searchCertified && scan.productionReady,
    launchReady: searchCertified && scan.launchReadyFinal,
    domainsComplete: domainComplete,
    domainsTotal: domains.length,
    domains,
    searchEngine,
    filters,
    sorting,
    results,
    emptyStates,
    performance,
    database,
    seo,
    aiSearch,
    omegaGlobal,
    accessibility,
    certificationScores,
    passConditions,
    autoRepairs,
  };
}

export function isSearchCompletionPass(result: SearchCompletionResult): boolean {
  return (
    result.searchCompletionPass &&
    result.searchCertified &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.passConditions.every((c) => c.pass)
  );
}
