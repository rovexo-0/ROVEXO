export {
  detectSearchBarTopGap,
  integrityScoreFromScan,
  isHomepageIntegrityPass,
  runHomepageCategoryIntegrityScan,
  scanCategoryNavDuplication,
  scanHomepageLayoutOptimization,
  scanHomepageSectionDuplication,
  scanSearchSuggestionDuplication,
} from "@/lib/homepage-category-integrity-engine/analyzer";
export {
  CANONICAL_HOMEPAGE_CATEGORY_SOURCES,
  DUPLICATION_SCAN_TARGETS,
  INTEGRITY_FAIL_CONDITIONS,
  INTEGRITY_OMEGA_SCORES,
  INTEGRITY_VALIDATION_CYCLES,
  LAYOUT_OPTIMIZATION_TARGETS,
  PREMIUM_2026_LAYOUT_SPEC,
} from "@/lib/homepage-category-integrity-engine/registry";
export type {
  DuplicationFinding,
  DuplicationScanTarget,
  IntegrityFailCondition,
  IntegrityScanResult,
  IntegrityStatus,
  IntegrityValidationCycle,
  LayoutFinding,
  LayoutOptimizationTarget,
} from "@/lib/homepage-category-integrity-engine/types";
