import type {
  BANNER_VALIDATION_CHECKS,
  HOMEPAGE_ENGINEERING_SCORES,
  HOMEPAGE_FULL_SCAN_COMPONENTS,
  HOMEPAGE_LAYOUT_TARGETS,
  HOMEPAGE_PRODUCTION_GATES,
  HOMEPAGE_UI_INTEGRITY_CHECKS,
} from "@/lib/homepage-engineering-director/registry";

export type HomepageFullScanComponent = (typeof HOMEPAGE_FULL_SCAN_COMPONENTS)[number];
export type HomepageUiIntegrityCheck = (typeof HOMEPAGE_UI_INTEGRITY_CHECKS)[number];
export type HomepageLayoutTarget = (typeof HOMEPAGE_LAYOUT_TARGETS)[number];
export type BannerValidationCheck = (typeof BANNER_VALIDATION_CHECKS)[number];
export type HomepageEngineeringScoreKey = (typeof HOMEPAGE_ENGINEERING_SCORES)[number];
export type HomepageProductionGate = (typeof HOMEPAGE_PRODUCTION_GATES)[number];

export type EngineeringStatus = "pass" | "warning" | "fail";

export type ComponentScanResult = {
  id: string;
  component: HomepageFullScanComponent;
  label: string;
  sourceRef: string;
  status: EngineeringStatus;
  complete: boolean;
  message: string;
};

export type EngineeringCheckResult = {
  id: string;
  check: HomepageUiIntegrityCheck | HomepageLayoutTarget | BannerValidationCheck;
  category: "ui-integrity" | "layout" | "banner";
  status: EngineeringStatus;
  findings: number;
  message: string;
};

export type EngineeringScoreCard = {
  key: HomepageEngineeringScoreKey;
  label: string;
  score: number;
  status: EngineeringStatus;
  weight: number;
};

export type ProductionGateResult = {
  gate: HomepageProductionGate;
  label: string;
  passPercent: number;
  status: EngineeringStatus;
};

export type HomepageEngineeringScanResult = {
  scannedAt: string;
  passPercent: number;
  status: EngineeringStatus;
  completionPercent: number;
  healthScore: number;
  navigationIntegrityScore: number;
  certificationEligible: boolean;
  productionReady: boolean;
  components: ComponentScanResult[];
  checks: EngineeringCheckResult[];
  scores: EngineeringScoreCard[];
  productionGates: ProductionGateResult[];
  legacyViolations: string[];
};
