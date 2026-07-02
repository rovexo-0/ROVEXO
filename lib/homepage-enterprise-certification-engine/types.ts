import type {
  ACCESSIBILITY_CHECKS,
  BUTTON_INTERACTION_CHECKS,
  CATEGORY_VALIDATION_CHECKS,
  CERTIFICATION_STAGES,
  EXPORT_FORMATS,
  HOMEPAGE_SECTIONS,
  LISTING_VALIDATION_CHECKS,
  OMEGA_CERTIFICATION_SCORES,
  PERFORMANCE_METRICS,
  REPORT_TYPES,
  RESPONSIVE_BREAKPOINTS,
  SEARCH_VALIDATION_CHECKS,
  SEO_CHECKS,
} from "@/lib/homepage-enterprise-certification-engine/registry";
import type {
  DuplicationFinding,
  IntegrityScanResult,
  LayoutFinding,
} from "@/lib/homepage-category-integrity-engine/types";
import type { HomepageEngineeringScanResult } from "@/lib/homepage-engineering-director/types";

export type HomepageCertificationTab =
  | "dashboard"
  | "sections"
  | "buttons"
  | "search"
  | "categories"
  | "listings"
  | "responsive"
  | "performance"
  | "accessibility"
  | "seo"
  | "integrity"
  | "reports";

export type HomepageSectionId = (typeof HOMEPAGE_SECTIONS)[number];
export type ButtonInteractionCheck = (typeof BUTTON_INTERACTION_CHECKS)[number];
export type SearchValidationCheck = (typeof SEARCH_VALIDATION_CHECKS)[number];
export type CategoryValidationCheck = (typeof CATEGORY_VALIDATION_CHECKS)[number];
export type ListingValidationCheck = (typeof LISTING_VALIDATION_CHECKS)[number];
export type ResponsiveBreakpoint = (typeof RESPONSIVE_BREAKPOINTS)[number];
export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number];
export type AccessibilityCheck = (typeof ACCESSIBILITY_CHECKS)[number];
export type SeoCheck = (typeof SEO_CHECKS)[number];
export type OmegaCertificationScoreKey = (typeof OMEGA_CERTIFICATION_SCORES)[number];
export type CertificationStage = (typeof CERTIFICATION_STAGES)[number];
export type HomepageCertificationReportType = (typeof REPORT_TYPES)[number];
export type HomepageCertificationExportFormat = (typeof EXPORT_FORMATS)[number];
export type HomepageCertificationStatus = "pass" | "warning" | "fail" | "pending" | "running" | "blocked";

export type HomepageCertificationDashboard = {
  overallPassPercent: number;
  sectionsCertified: number;
  sectionsTotal: number;
  openIssues: number;
  certificationGranted: boolean;
  productionReady: boolean;
  enterpriseScore: number;
  lastCertifiedAt?: string;
};

export type OmegaCertificationScore = {
  key: OmegaCertificationScoreKey;
  label: string;
  score: number;
  status: HomepageCertificationStatus;
  weight: number;
};

export type SectionValidationItem = {
  id: string;
  section: HomepageSectionId;
  label: string;
  status: HomepageCertificationStatus;
  passPercent: number;
  componentRef: string;
  lastValidatedAt: string;
};

export type ButtonValidationItem = {
  id: string;
  check: ButtonInteractionCheck;
  label: string;
  target: string;
  status: HomepageCertificationStatus;
  lastValidatedAt: string;
};

export type SearchValidationItem = {
  id: string;
  check: SearchValidationCheck;
  label: string;
  status: HomepageCertificationStatus;
  lastValidatedAt: string;
};

export type CategoryValidationItem = {
  id: string;
  check: CategoryValidationCheck;
  label: string;
  status: HomepageCertificationStatus;
  lastValidatedAt: string;
};

export type ListingValidationItem = {
  id: string;
  check: ListingValidationCheck;
  label: string;
  status: HomepageCertificationStatus;
  lastValidatedAt: string;
};

export type ResponsiveValidationItem = {
  id: string;
  breakpoint: ResponsiveBreakpoint;
  label: string;
  status: HomepageCertificationStatus;
  viewport: string;
  lastValidatedAt: string;
};

export type PerformanceValidationItem = {
  id: string;
  metric: PerformanceMetric;
  label: string;
  value: string;
  target: string;
  status: HomepageCertificationStatus;
  lastMeasuredAt: string;
};

export type AccessibilityValidationItem = {
  id: string;
  check: AccessibilityCheck;
  label: string;
  status: HomepageCertificationStatus;
  findings: number;
  lastValidatedAt: string;
};

export type SeoValidationItem = {
  id: string;
  check: SeoCheck;
  label: string;
  status: HomepageCertificationStatus;
  lastValidatedAt: string;
};

export type CertificationRun = {
  id: string;
  stage: CertificationStage;
  status: HomepageCertificationStatus;
  passPercent: number;
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
};

export type CertificationFailure = {
  id: string;
  issue: string;
  affectedSection?: HomepageSectionId;
  severity: "low" | "medium" | "high" | "critical";
  recommendedFix: string;
  validationOnly: boolean;
  status: HomepageCertificationStatus;
  certificationImpact: number;
};

export type HomepageCertificationReport = {
  id: string;
  type: HomepageCertificationReportType;
  title: string;
  generatedAt: string;
  status: HomepageCertificationStatus;
};

export type HomepageCertificationAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: HomepageCertificationStatus;
};

export type HomepageIntegrityValidationItem = {
  id: string;
  check: "category-duplication" | "section-duplication" | "layout-optimization" | "search-bar-gap" | "visual-consistency";
  label: string;
  status: HomepageCertificationStatus;
  findings: number;
  lastValidatedAt: string;
};

export type HomepageCertificationSettings = {
  validationOnlyMode: boolean;
  blockProtectedAreaFixes: boolean;
  coordinateWithQa: boolean;
  coordinateWithGovernance: boolean;
  coordinateWithCertification: boolean;
  requirePass100: boolean;
};

export type HomepageCertificationState = {
  dashboard: HomepageCertificationDashboard;
  omegaScores: OmegaCertificationScore[];
  sections: SectionValidationItem[];
  buttons: ButtonValidationItem[];
  search: SearchValidationItem[];
  categories: CategoryValidationItem[];
  listings: ListingValidationItem[];
  responsive: ResponsiveValidationItem[];
  performance: PerformanceValidationItem[];
  accessibility: AccessibilityValidationItem[];
  seo: SeoValidationItem[];
  integrity: HomepageIntegrityValidationItem[];
  integrityScan: IntegrityScanResult;
  engineeringScan: HomepageEngineeringScanResult;
  duplicationFindings: DuplicationFinding[];
  layoutFindings: LayoutFinding[];
  certificationRuns: CertificationRun[];
  failures: CertificationFailure[];
  reports: HomepageCertificationReport[];
  auditEntries: HomepageCertificationAuditEntry[];
};

export type HomepageCertificationSnapshot = HomepageCertificationState & {
  tab: HomepageCertificationTab;
  settings: HomepageCertificationSettings;
  history: { id: string; action: string; actor: string; timestamp: string }[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical"; score: number; message: string };
};
