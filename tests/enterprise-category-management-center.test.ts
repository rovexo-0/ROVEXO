import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { taxonomyStats } from "@/lib/categories/enterprise";
import { canPerformCategoryManagementAction, requiresMfaForCategoryManagement } from "@/lib/enterprise-category-management-center/audit";
import { isCategoryManagementConfigAction } from "@/lib/enterprise-category-management-center/config-actions";
import { CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-category-management-center/descriptor";
import {
  analyzeCategoryIssue,
  computeCategoryEnterpriseScore,
  createDefaultCategoryManagementSettings,
  createDefaultCategoryManagementState,
  isCategoryCertificationEligible,
  isProtectedCategoryTarget,
  mergeDbCategoriesIntoState,
  runTaxonomyValidation,
} from "@/lib/enterprise-category-management-center/engine";
import { exportCategoryManagementSnapshot, isValidCategoryManagementExportFormat } from "@/lib/enterprise-category-management-center/export";
import { computeCategoryManagementHealth } from "@/lib/enterprise-category-management-center/health";
import { validateCategoryManagementReadiness } from "@/lib/enterprise-category-management-center/reader";
import {
  CATEGORY_MANAGEMENT_API,
  CATEGORY_MANAGEMENT_ROUTES,
  EDITOR_FIELDS,
  INSPECTOR_CHECKS,
  OMEGA_CATEGORY_SCORES,
  PROTECTED_AREAS,
  TREE_FEATURES,
  VALIDATION_CHECKS,
} from "@/lib/enterprise-category-management-center/registry";
import type { CategoryManagementSnapshot } from "@/lib/enterprise-category-management-center/types";

function sampleSnapshot(): CategoryManagementSnapshot {
  const state = createDefaultCategoryManagementState();
  const settings = createDefaultCategoryManagementSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_category_management_center_v1: true,
      tree_editor_enabled: true,
      ai_assistant_enabled: true,
      version_control_enabled: true,
      import_export_enabled: true,
      validation_only_mode: true,
      omega_score_engine_enabled: true,
      require_pass_100: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("enterprise category management descriptor", () => {
  it("registers module id", () => {
    expect(CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.id).toBe("enterprise-category-management-center");
  });

  it("auto registers", () => {
    expect(CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/category-management");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-category-management-center")?.id).toBe("enterprise-category-management-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-category-management-center")?.moduleId).toBe("enterprise-category-management-center");
  });
});

describe("enterprise category management registry constants", () => {
  it("defines tree features", () => {
    expect(TREE_FEATURES).toContain("drag-drop");
    expect(TREE_FEATURES).toContain("search");
  });

  it("defines editor fields", () => {
    expect(EDITOR_FIELDS).toContain("seo-title");
    expect(EDITOR_FIELDS.length).toBeGreaterThan(20);
  });

  it("defines routes and api", () => {
    expect(CATEGORY_MANAGEMENT_ROUTES.length).toBe(10);
    expect(CATEGORY_MANAGEMENT_API.sync).toBe("/api/super-admin/category-management/sync");
  });

  it("defines protected areas", () => {
    expect(PROTECTED_AREAS).toContain("payments");
    expect(PROTECTED_AREAS).toContain("marketplace-transactions");
  });
});

describe("enterprise category management engine", () => {
  it("creates default state with taxonomy data", () => {
    const state = createDefaultCategoryManagementState();
    expect(state.treeNodes.length).toBe(taxonomyStats.roots);
    expect(state.omegaScores.length).toBe(OMEGA_CATEGORY_SCORES.length);
    expect(state.validationItems.length).toBe(VALIDATION_CHECKS.length);
    expect(state.inspectorChecks.length).toBe(INSPECTOR_CHECKS.length);
  });

  it("computes enterprise score at 100", () => {
    const state = createDefaultCategoryManagementState();
    expect(computeCategoryEnterpriseScore(state)).toBe(100);
  });

  it("runs taxonomy validation", () => {
    const result = runTaxonomyValidation();
    expect(result.passPercent).toBe(100);
    expect(result.status).toBe("pass");
  });

  it("merges db categories", () => {
    const state = createDefaultCategoryManagementState();
    const merged = mergeDbCategoriesIntoState(state, [
      { id: "1", name: "Test", slug: "test", parentId: null, pathLabel: "Test", sortOrder: 0, icon: "🏷️", seoTitle: null, seoDescription: null, isActive: true },
    ]);
    expect(merged.treeNodes.length).toBe(1);
    expect(merged.dashboard.totalCategories).toBe(1);
  });

  it("detects protected targets", () => {
    expect(isProtectedCategoryTarget("payments")).toBe(true);
    expect(isProtectedCategoryTarget("category-rail")).toBe(false);
  });

  it("analyzes issues with protected blocking", () => {
    expect(analyzeCategoryIssue("Slug conflict").status).not.toBe("blocked");
    expect(analyzeCategoryIssue("Payment category", "payments").status).toBe("blocked");
  });

  it("checks certification eligibility", () => {
    const state = createDefaultCategoryManagementState();
    expect(isCategoryCertificationEligible(state.dashboard, state.omegaScores)).toBe(true);
  });
});

describe("enterprise category management export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidCategoryManagementExportFormat("json")).toBe(true);
    expect(exportCategoryManagementSnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportCategoryManagementSnapshot(snapshot, "pdf")).toContain("Total Categories");
  });

  it("computes health and readiness", () => {
    const snapshot = sampleSnapshot();
    expect(computeCategoryManagementHealth(snapshot).checks.length).toBeGreaterThan(0);
    expect(validateCategoryManagementReadiness(snapshot).ready).toBe(true);
  });
});

describe("enterprise category management audit", () => {
  it("maps config actions", () => {
    expect(isCategoryManagementConfigAction("publish-config")).toBe(true);
  });

  it("requires mfa for sync and certify", () => {
    expect(requiresMfaForCategoryManagement("sync")).toBe(true);
    expect(requiresMfaForCategoryManagement("validate")).toBe(false);
  });

  it("allows validate action", () => {
    expect(canPerformCategoryManagementAction({ action: "validate" }).allowed).toBe(true);
  });
});
