import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import {
  computeOverallRiskScore,
  generateDeploymentAiInsights,
  shouldRecommendRollback,
} from "@/lib/enterprise-deployment-center/ai-integration";
import {
  canPerformDeploymentAction,
  createDeploymentAuditEntry,
  requiresMfaForDeployment,
} from "@/lib/enterprise-deployment-center/audit";
import {
  createDeploymentBuild,
  runValidations,
  validationScore,
  isValidValidationType,
} from "@/lib/enterprise-deployment-center/builds";
import { isDeploymentConfigAction } from "@/lib/enterprise-deployment-center/config-actions";
import { ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-deployment-center/descriptor";
import {
  createDefaultEnvironments,
  isValidEnvironment,
  updateEnvironmentVersion,
} from "@/lib/enterprise-deployment-center/environments";
import {
  buildDeploymentDashboard,
  createDefaultDeploymentSettings,
  createDefaultDeploymentState,
} from "@/lib/enterprise-deployment-center/engine";
import {
  createDefaultFeatureFlags,
  setRolloutPercentage,
  toggleFeatureFlag,
} from "@/lib/enterprise-deployment-center/feature-flags";
import { computeDeploymentHealth } from "@/lib/enterprise-deployment-center/health";
import {
  allChecksPassed,
  listPostDeployChecks,
  postDeployHealthScore,
  runPostDeployChecks,
} from "@/lib/enterprise-deployment-center/post-deploy";
import {
  generateReleaseNotes,
  formatReleaseNotesMarkdown,
  hasBreakingChanges,
} from "@/lib/enterprise-deployment-center/release-notes";
import {
  approveRelease,
  createRelease,
  isValidReleaseType,
  markDeployed,
  pendingApprovals,
  rejectRelease,
} from "@/lib/enterprise-deployment-center/releases";
import {
  DEPLOYMENT_CENTER_API,
  DEPLOYMENT_CENTER_ROUTES,
  DEPLOYMENT_ENVIRONMENTS,
  DEPLOYMENT_STRATEGIES,
  WORKFLOW_STAGES,
  POST_DEPLOY_CHECKS,
} from "@/lib/enterprise-deployment-center/registry";
import { validateDeploymentReadiness } from "@/lib/enterprise-deployment-center/reader";
import {
  createRollbackPlan,
  emergencyRollback,
  isRollbackAvailable,
  rollbackRelease,
} from "@/lib/enterprise-deployment-center/rollback";
import {
  isValidStrategy,
  isZeroDowntimeStrategy,
  strategyRolloutPercent,
} from "@/lib/enterprise-deployment-center/strategies";
import {
  validateBuildIntegrity,
  validateRelease,
} from "@/lib/enterprise-deployment-center/validation";
import {
  advanceToManualApproval,
  canDeploy,
  getNextStage,
  workflowProgress,
} from "@/lib/enterprise-deployment-center/workflow";
import type { DeploymentSnapshot } from "@/lib/enterprise-deployment-center/types";

function sampleSnapshot(overrides: Partial<DeploymentSnapshot> = {}): DeploymentSnapshot {
  const state = createDefaultDeploymentState();
  const settings = createDefaultDeploymentSettings();
  return {
    tab: "dashboard",
    dashboard: buildDeploymentDashboard(state, settings),
    environments: state.environments,
    releases: state.releases,
    builds: state.builds,
    queue: state.queue,
    featureFlags: state.featureFlags,
    releaseNotes: state.releaseNotes,
    aiInsights: state.aiInsights,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      deployment_center_enabled: true,
      blue_green_enabled: true,
      canary_enabled: true,
      ai_validation_enabled: true,
      certification_gate_enabled: true,
      approval_workflow_enabled: true,
      auto_rollback_enabled: true,
      release_notes_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: 90, message: "ok" },
    ...overrides,
  };
}

describe("deployment center descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.id).toBe("enterprise-deployment-center");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/deployment");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-deployment-center")?.id).toBe("enterprise-deployment-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-deployment-center")?.moduleId).toBe("enterprise-deployment-center");
  });
});

describe("build and deploy", () => {
  it("creates deployment build", () => {
    const build = createDeploymentBuild("2.5.0");
    expect(build.version).toBe("2.5.0");
    expect(build.status).toBe("building");
  });

  it("runs validations on build", () => {
    const validated = runValidations(createDeploymentBuild("2.5.0"));
    expect(validated.status).toBe("validated");
    expect(validationScore(validated)).toBe(100);
  });

  it("validates build integrity", () => {
    const result = validateBuildIntegrity(runValidations(createDeploymentBuild("2.5.0")));
    expect(result.passed).toBe(true);
  });
});

describe("environment manager", () => {
  it("creates all environments", () => {
    expect(createDefaultEnvironments()).toHaveLength(DEPLOYMENT_ENVIRONMENTS.length);
  });

  it("validates environment id", () => {
    expect(isValidEnvironment("production")).toBe(true);
    expect(isValidEnvironment("invalid")).toBe(false);
  });

  it("updates environment version", () => {
    const updated = updateEnvironmentVersion(createDefaultEnvironments(), "staging", "2.5.1");
    expect(updated.find((e) => e.id === "staging")?.version).toBe("2.5.1");
  });
});

describe("release workflow", () => {
  it("creates release", () => {
    const release = createRelease("release-candidate", "2.5.0-rc.1");
    expect(release.status).toBe("draft");
    expect(release.stage).toBe("draft");
  });

  it("validates release type", () => {
    expect(isValidReleaseType("hotfix")).toBe(true);
  });

  it("approves release", () => {
    const approved = approveRelease(createRelease("beta", "2.5.0-beta"));
    expect(approved.status).toBe("approved");
    expect(approved.stage).toBe("deployment");
  });

  it("rejects release", () => {
    expect(rejectRelease(createRelease("beta", "2.5.0")).status).toBe("failed");
  });

  it("marks deployed", () => {
    const deployed = markDeployed(approveRelease(createRelease("public-release", "2.5.0", "production")));
    expect(deployed.status).toBe("deployed");
    expect(deployed.stage).toBe("completed");
  });

  it("lists pending approvals", () => {
    const state = createDefaultDeploymentState();
    expect(pendingApprovals(state.releases).length).toBeGreaterThan(0);
  });
});

describe("approval workflow", () => {
  it("advances workflow stages", () => {
    expect(getNextStage("draft")).toBe("validation");
    expect(workflowProgress("completed")).toBe(100);
  });

  it("requires approval before deploy", () => {
    const approved = approveRelease(createRelease("release-candidate", "2.5.0"));
    expect(canDeploy(approved)).toBe(true);
  });

  it("advances to manual approval", () => {
    const release = advanceToManualApproval(createRelease("internal", "2.5.0"));
    expect(release.stage).toBe("manual-approval");
    expect(release.status).toBe("pending-approval");
  });

  it("covers workflow stages", () => {
    expect(WORKFLOW_STAGES).toHaveLength(8);
  });
});

describe("deployment strategies", () => {
  it("lists strategies", () => {
    expect(DEPLOYMENT_STRATEGIES.length).toBe(8);
  });

  it("validates strategy", () => {
    expect(isValidStrategy("canary")).toBe(true);
    expect(isValidStrategy("invalid")).toBe(false);
  });

  it("canary has low rollout percent", () => {
    expect(strategyRolloutPercent("canary")).toBe(5);
  });

  it("blue-green is zero downtime", () => {
    expect(isZeroDowntimeStrategy("blue-green")).toBe(true);
  });
});

describe("rollback", () => {
  it("creates rollback plan", () => {
    const plan = createRollbackPlan(createRelease("public-release", "2.5.0"));
    expect(plan.type).toBe("one-click");
  });

  it("rolls back release", () => {
    const rolled = rollbackRelease(markDeployed(createRelease("public-release", "2.5.0", "production")));
    expect(rolled.status).toBe("rolled-back");
  });

  it("emergency rollback", () => {
    expect(emergencyRollback(createRelease("emergency-release", "2.5.0")).status).toBe("rolled-back");
  });

  it("detects rollback availability", () => {
    expect(isRollbackAvailable(createDefaultDeploymentState().deploymentHistory)).toBe(true);
  });
});

describe("post deployment checks", () => {
  it("runs all post deploy checks", () => {
    expect(runPostDeployChecks()).toHaveLength(POST_DEPLOY_CHECKS.length);
  });

  it("all checks pass", () => {
    expect(allChecksPassed(runPostDeployChecks())).toBe(true);
  });

  it("computes health score", () => {
    expect(postDeployHealthScore(runPostDeployChecks())).toBe(100);
  });

  it("lists post deploy checks", () => {
    expect(listPostDeployChecks().length).toBe(10);
  });
});

describe("release notes", () => {
  it("generates release notes", () => {
    const notes = generateReleaseNotes("2.5.0");
    expect(notes.newFeatures.length).toBeGreaterThan(0);
    expect(notes.rollbackInstructions.length).toBeGreaterThan(0);
  });

  it("formats markdown", () => {
    expect(formatReleaseNotesMarkdown(generateReleaseNotes("2.5.0"))).toContain("# Release 2.5.0");
  });

  it("detects breaking changes", () => {
    expect(hasBreakingChanges(generateReleaseNotes("2.5.0"))).toBe(false);
  });
});

describe("ai validation", () => {
  it("generates ai insights", () => {
    const state = createDefaultDeploymentState();
    const insights = generateDeploymentAiInsights(state.releases, state.builds);
    expect(insights.length).toBeGreaterThan(0);
  });

  it("computes overall risk score", () => {
    const state = createDefaultDeploymentState();
    const score = computeOverallRiskScore(generateDeploymentAiInsights(state.releases, state.builds));
    expect(score).toBeGreaterThan(0);
  });

  it("validates release with build", () => {
    const release = createRelease("release-candidate", "2.5.0-rc.1", "staging");
    const build = runValidations(createDeploymentBuild("2.5.0-rc.1"));
    const result = validateRelease(release, build);
    expect(result.score).toBeGreaterThan(0);
  });

  it("validates validation type", () => {
    expect(isValidValidationType("integrity-check")).toBe(true);
  });
});

describe("feature flags", () => {
  it("creates default flags", () => {
    expect(createDefaultFeatureFlags().length).toBeGreaterThan(0);
  });

  it("toggles flag", () => {
    const flag = createDefaultFeatureFlags()[0]!;
    expect(toggleFeatureFlag(flag, false).enabled).toBe(false);
  });

  it("sets rollout percentage", () => {
    const flag = setRolloutPercentage(createDefaultFeatureFlags()[0]!, 50);
    expect(flag.percentage).toBe(50);
  });
});

describe("permissions and audit", () => {
  it("allows view", () => {
    expect(canPerformDeploymentAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for deploy", () => {
    expect(canPerformDeploymentAction({ action: "deploy", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformDeploymentAction({ action: "deploy", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for rollback", () => {
    expect(canPerformDeploymentAction({ action: "rollback", mfaVerified: false }).allowed).toBe(false);
  });

  it("flags mfa audit actions", () => {
    expect(requiresMfaForDeployment("rollback")).toBe(true);
    expect(requiresMfaForDeployment("build")).toBe(false);
  });

  it("creates audit entry", () => {
    const entry = createDeploymentAuditEntry("deployment", "admin", "production");
    expect(entry.action).toBe("deployment");
  });
});

describe("config lifecycle", () => {
  it("recognizes config actions", () => {
    expect(isDeploymentConfigAction("publish-config")).toBe(true);
    expect(isDeploymentConfigAction("deploy")).toBe(false);
  });

  it("exposes config keys", () => {
    expect(ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.configKeys.draft).toBe("enterprise_deployment_draft_v1");
  });
});

describe("api registry", () => {
  it("defines snapshot endpoint", () => {
    expect(DEPLOYMENT_CENTER_API.snapshot).toBe("/api/super-admin/deployment");
  });

  it("defines deploy endpoint", () => {
    expect(DEPLOYMENT_CENTER_API.deploy).toBe("/api/super-admin/deployment/deploy");
  });

  it("defines rollback endpoint", () => {
    expect(DEPLOYMENT_CENTER_API.rollback).toBe("/api/super-admin/deployment/rollback");
  });
});

describe("routes", () => {
  it("defines five routes", () => {
    expect(DEPLOYMENT_CENTER_ROUTES).toHaveLength(5);
  });

  it("includes rollback center", () => {
    expect(DEPLOYMENT_CENTER_ROUTES.find((r) => r.id === "rollback")?.href).toBe("/super-admin/deployment/rollback");
  });
});

describe("health and readiness", () => {
  it("computes health when enabled", () => {
    expect(computeDeploymentHealth(sampleSnapshot()).score).toBeGreaterThan(0);
  });

  it("reports failed when disabled", () => {
    expect(computeDeploymentHealth(sampleSnapshot({
      featureFlagsConfig: { ...sampleSnapshot().featureFlagsConfig, deployment_center_enabled: false },
    })).status).toBe("failed");
  });

  it("validates readiness", () => {
    expect(validateDeploymentReadiness(sampleSnapshot()).ready).toBe(true);
  });
});

describe("enterprise registration", () => {
  it("links to certification center", () => {
    expect(ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.relatedModules).toContain("certification-center");
  });

  it("links to workflow engine", () => {
    expect(ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-workflow-engine");
  });

  it("has deploy permissions", () => {
    const actions = ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.permissions.map((p) => p.action);
    expect(actions).toContain("deploy");
    expect(actions).toContain("approve");
    expect(actions).toContain("rollback");
  });
});

describe("dashboard", () => {
  it("builds dashboard metrics", () => {
    const dashboard = buildDeploymentDashboard(createDefaultDeploymentState(), createDefaultDeploymentSettings());
    expect(dashboard.productionVersion).toBeTruthy();
    expect(dashboard.deploymentHealth).toBeGreaterThan(0);
    expect(dashboard.rollbackAvailable).toBe(true);
  });
});
