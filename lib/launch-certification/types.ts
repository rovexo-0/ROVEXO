/** LAUNCH_CERTIFICATION_MASTER_SPEC — types */

export type CertificationStatus = "pass" | "fail" | "pending";

export type CertificationSeverity = "critical" | "high" | "medium" | "low";

export type CertificationModuleId =
  | "sell"
  | "product_details"
  | "checkout"
  | "transaction_hub"
  | "wallet"
  | "orders"
  | "tracking"
  | "notifications"
  | "reviews"
  | "admin"
  | "super_admin"
  | "seo"
  | "security"
  | "performance"
  | "accessibility";

export type { CertificationDashboardModuleId } from "@/lib/launch-certification/certification-mode-document2";

import type { CertificationDashboardModuleId } from "@/lib/launch-certification/certification-mode-document2";

export type CertificationModuleResult = {
  id: CertificationModuleId | CertificationDashboardModuleId;
  label: string;
  status: CertificationStatus;
  checks: Array<{ id: string; pass: boolean; detail?: string }>;
};

export type LaunchCertificationScanResult = {
  version: string;
  scannedAt: string;
  modules: CertificationModuleResult[];
  passCount: number;
  totalCount: number;
  passPercent: number;
  allPassed: boolean;
  launchApproved: boolean;
  blockers: string[];
};

export type DemoCertificationRole = "buyer" | "seller" | "admin" | "super_admin";

export type DemoCertificationAccount = {
  role: DemoCertificationRole;
  label: string;
  demoUserKey: string;
  email: string;
};
