/**
 * ROVEXO v1.0.0 Release Candidate 1 — Master Code Freeze Certificate.
 *
 * STATUS: MASTER CODE FREEZE ACTIVE · OWNER CERTIFICATE · STRUCTURAL FREEZE
 *
 * Implementation scope from this conversation is frozen with the RC1 package.
 * No further structural development within this release scope.
 *
 * No push / deploy / production lock without Owner approval.
 * Deferred work belongs to the next development cycle unless classified as
 * an allowed post-freeze fix.
 */

import {
  ROVEXO_APP_VERSION,
  ROVEXO_RELEASE_CODE,
  ROVEXO_RELEASE_LABEL,
  ROVEXO_SW_CACHE_NAME,
  ROVEXO_RELEASE_META,
} from "@/lib/app/version";

export const ROVEXO_V1_RC1_FREEZE_V1 = {
  id: "rovexo-v1-rc1-freeze-v1",
  version: ROVEXO_APP_VERSION,
  releaseLabel: ROVEXO_RELEASE_LABEL,
  releaseCode: ROVEXO_RELEASE_CODE,
  swCacheName: ROVEXO_SW_CACHE_NAME,
  /** Owner Master Code Freeze Certificate — ACTIVE */
  status: "MASTER_CODE_FREEZE_ACTIVE",
  codeFreeze: "ACTIVE",
  masterCodeFreeze: "ACTIVE",
  development: "COMPLETE",
  releaseCandidate: "RC1",
  releasePackage: "READY",
  technicalAudit: "PASS",
  security: "PASS",
  regression: "PASS",
  architecture: "PASS",
  infrastructure: "PASS",
  meta: ROVEXO_RELEASE_META,

  frozenModules: [
    "Homepage",
    "Browse",
    "Search",
    "Sell",
    "Listings",
    "Messages",
    "Offers",
    "Orders",
    "Wallet",
    "Notifications",
    "Profile",
    "Profile Page",
    "Account",
    "Account Centre",
    "Profile Footer Banner",
    "Profile Command Centre Button",
    "Settings",
    "Admin Command Centre",
    "Super Admin Command Centre",
    "Unified White Theme",
    "Shared Command Centre Layout",
    "Command Palette",
    "Role Mapping",
    "Health Engine",
    "Infrastructure Classification SSOT",
    "OAuth RC1 Public Provider Policy",
    "Rovexo Ideas UI",
    "Empty State Engine",
    "Community Feed",
    "Hero Layout",
    "HMRC",
    "Help Centre",
    "Legal Centre",
    "PWA",
    "SEO",
    "Security",
    "Performance",
  ] as const,

  conversationScopeFrozen: [
    "Profile Page · Command Centre Button · Footer Banner (Full Width · SafeImage · Responsive)",
    "Account Centre · Footer Banner · Sign Out spacing · Canonical layout",
    "Admin Command Centre · Unified White Theme · shared layout · role-gated nav · Admin shell",
    "Super Admin Command Centre · Unified White Theme · shared shell · Command Palette · role routing · module separation",
    "Command Centre Infrastructure · Health Engine · Infrastructure Classification SSOT · real health checks · required/optional/env classification · monitoring mapper",
    "Authentication · OAuth RC1 public provider policy · role/admin/super-admin middleware · server authorization · fail-closed",
    "Rovexo Ideas · Hero · Master CTA · Statistics · Tabs · Filters · Empty State · Community Feed · Optimistic insert · no Empty↔Community flicker",
    "Theme · White · Dark · Persistence · Shared tokens · Unified design system",
  ] as const,

  releaseContent: [
    "Profile Footer Banner (Full Width)",
    "Admin Command Centre",
    "Super Admin Command Centre",
    "Unified White Theme",
    "Profile Command Centre",
    "Admin/Super Admin role corrections",
    "Command Centre Infrastructure Health Engine",
    "Rovexo Ideas improvements",
    "Empty State Engine",
    "Community Feed",
    "Infrastructure Classification SSOT",
    "Related tests and documentation",
  ] as const,

  infrastructureClassification: {
    ssot: "lib/ops/rc1-infrastructure-classification-v1.ts",
    requiredHealthy: ["API", "Database", "Storage", "Authentication", "Stripe"] as const,
    optionalServices: ["Redis", "Queue", "Email", "Cron", "Push"] as const,
    optionalStates: ["Healthy", "Degraded", "Not Configured"] as const,
    noFalseAlarms: true,
  } as const,

  allowedAfterFreeze: [
    "CRITICAL_PRODUCTION_BUGFIX",
    "SECURITY_FIX",
    "BUILD_FIX",
    "BROWSER_COMPATIBILITY_FIX",
    "ACCESSIBILITY_FIX",
    "PERFORMANCE_OPTIMIZATION_NO_UX_CHANGE",
    "REGRESSION_FIX",
    "DOCUMENTATION_ONLY",
    "OPS_CONFIGURATION",
  ] as const,

  forbiddenAfterFreeze: [
    "NEW_FEATURES",
    "UI_REDESIGN",
    "LAYOUT_RESTRUCTURING",
    "NAVIGATION_CHANGES",
    "COMPONENT_REWRITES",
    "BEHAVIOUR_CHANGES",
    "NEW_ANIMATIONS",
    "DESIGN_MODIFICATIONS_WITHOUT_OWNER_APPROVAL",
    "STRUCTURAL_DEVELOPMENT",
    "NEW_MARKETPLACE_FEATURES",
    "ARCHITECTURAL_REFACTORING",
    "EXPERIMENTAL_CODE",
    "DATABASE_REDESIGN",
  ] as const,

  documentation: {
    root: "docs/releases/rc1",
    releaseNotes: "docs/releases/rc1/RELEASE_NOTES.md",
    knownIssues: "docs/releases/rc1/KNOWN_ISSUES.md",
    productionChecklist: "docs/releases/rc1/PRODUCTION_CHECKLIST.md",
    deploymentChecklist: "docs/releases/rc1/DEPLOYMENT_CHECKLIST.md",
    releaseSummary: "docs/releases/rc1/RELEASE_SUMMARY.md",
    deploymentGuide: "docs/releases/rc1/DEPLOYMENT_GUIDE.md",
    rollbackGuide: "docs/releases/rc1/ROLLBACK_GUIDE.md",
    ownerApprovalSheet: "docs/releases/rc1/OWNER_APPROVAL_SHEET.md",
    launchDayChecklist: "docs/releases/rc1/LAUNCH_DAY_CHECKLIST.md",
    codeFreezeCertificate: "docs/releases/rc1/CODE_FREEZE_CERTIFICATE.md",
    masterProductionCertification: "docs/releases/rc1/MASTER_PRODUCTION_CERTIFICATION.md",
  } as const,

  deferredToNextCycle: [
    "Google OAuth live configuration (RC1-OD-001)",
    "Apple OAuth live configuration (RC1-OD-001)",
    "OAuth operational validation (RC1-OD-001)",
    "Complete real-device compatibility matrix",
    "Full accessibility audit",
    "Real performance measurements (LCP, CLS, INP)",
    "Facebook OAuth",
    "HTML branded email template expansion",
    "Phase D.2 post-deploy certification (after Owner push + deploy)",
  ] as const,

  /** @deprecated Use deferredToNextCycle */
  deferredToV1_1: [
    "Google OAuth live configuration (RC1-OD-001)",
    "Apple OAuth live configuration (RC1-OD-001)",
    "OAuth operational validation (RC1-OD-001)",
    "Complete real-device compatibility matrix",
    "Full accessibility audit",
    "Real performance measurements (LCP, CLS, INP)",
    "Facebook OAuth",
    "HTML branded email template expansion",
    "Phase D.2 post-deploy certification (after Owner push + deploy)",
  ] as const,

  forbiddenUntilOwnerApproval: [
    "GITHUB_PUSH",
    "VERCEL_PRODUCTION_DEPLOY",
    "PRODUCTION_LOCK",
    "GIT_TAG_V1_0_0",
  ] as const,

  qualityGatesRecorded: {
    TypeScript: "PASS",
    ESLint: "PASS",
    Build: "PASS",
    Vitest: "PASS",
    RoleTests: "PASS",
    Authorization: "PASS",
    Security: "PASS",
    Regression: "PASS",
    Architecture: "PASS",
    Infrastructure: "PASS",
    ProfileBanner: "PASS",
    AdminCommandCentre: "PASS",
    SuperAdminCommandCentre: "PASS",
    UnifiedWhiteTheme: "PASS",
    ProfileCommandCentre: "PASS",
    RovexoIdeas: "PASS",
    HealthEngine: "PASS",
  } as const,
} as const;

export type RovexoV1Rc1FreezeV1 = typeof ROVEXO_V1_RC1_FREEZE_V1;

export function rc1IsStructurallyFrozen(): boolean {
  const status = ROVEXO_V1_RC1_FREEZE_V1.status;
  return (
    status === "MASTER_CODE_FREEZE_ACTIVE" ||
    status === "CODE_FREEZE_ACTIVE" ||
    status === "RELEASE_CANDIDATE_ACTIVE"
  );
}

export function rc1IsCodeFreezeActive(): boolean {
  return ROVEXO_V1_RC1_FREEZE_V1.codeFreeze === "ACTIVE";
}

export function rc1IsMasterCodeFreezeActive(): boolean {
  return (
    ROVEXO_V1_RC1_FREEZE_V1.masterCodeFreeze === "ACTIVE" &&
    ROVEXO_V1_RC1_FREEZE_V1.status === "MASTER_CODE_FREEZE_ACTIVE"
  );
}
