import type {
  DUPLICATION_SCAN_TARGETS,
  INTEGRITY_FAIL_CONDITIONS,
  INTEGRITY_VALIDATION_CYCLES,
  LAYOUT_OPTIMIZATION_TARGETS,
} from "@/lib/homepage-category-integrity-engine/registry";

export type IntegrityValidationCycle = (typeof INTEGRITY_VALIDATION_CYCLES)[number];
export type DuplicationScanTarget = (typeof DUPLICATION_SCAN_TARGETS)[number];
export type LayoutOptimizationTarget = (typeof LAYOUT_OPTIMIZATION_TARGETS)[number];
export type IntegrityFailCondition = (typeof INTEGRITY_FAIL_CONDITIONS)[number];

export type IntegrityStatus = "pass" | "warning" | "fail";

export type DuplicationFinding = {
  id: string;
  target: DuplicationScanTarget;
  kind: "id" | "slug" | "route" | "icon" | "card" | "section" | "featured" | "render";
  value: string;
  occurrences: number;
  sourceComponent: string;
  renderPipeline: string;
  intentional: boolean;
  status: IntegrityStatus;
  message: string;
};

export type LayoutFinding = {
  id: string;
  target: LayoutOptimizationTarget;
  issue: "empty-space" | "oversized-padding" | "oversized-margin" | "invisible-container" | "placeholder" | "collapsed-layout" | "safe-area-offset" | "viewport-waste" | "alignment" | "layout-gap";
  sourceComponent: string;
  cssSource: string;
  measuredPx?: number;
  thresholdPx?: number;
  status: IntegrityStatus;
  message: string;
};

export type IntegrityScanResult = {
  cycle: IntegrityValidationCycle;
  scannedAt: string;
  passPercent: number;
  status: IntegrityStatus;
  duplicationFindings: DuplicationFinding[];
  layoutFindings: LayoutFinding[];
  failConditions: IntegrityFailCondition[];
  duplicationCount: number;
  layoutIssueCount: number;
  searchBarTopGapPass: boolean;
  certificationEligible: boolean;
};
