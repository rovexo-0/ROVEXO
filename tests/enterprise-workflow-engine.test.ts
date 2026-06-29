import { describe, expect, it } from "vitest";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import {
  approveStep,
  createApprovalChain,
  rejectStep,
  resolveApprovalStatus,
  timeoutExpiredSteps,
} from "@/lib/enterprise-workflow-engine/approval";
import {
  addNodeToWorkflow,
  cloneWorkflowDefinition,
  compareWorkflowNodes,
  isValidNodeType,
  removeNodeFromWorkflow,
  validateWorkflowGraph,
} from "@/lib/enterprise-workflow-engine/builder";
import { canPerformWorkflowAction, requiresMfa, resolveWorkflowRole } from "@/lib/enterprise-workflow-engine/audit";
import { WORKFLOW_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-workflow-engine/descriptor";
import {
  createDefaultExecutions,
  createDefaultWorkflowEngineSettings,
  createDefaultWorkflowEngineState,
  createDefaultWorkflows,
  deleteWorkflow,
  findWorkflow,
  upsertWorkflow,
} from "@/lib/enterprise-workflow-engine/engine";
import {
  applyExecutionResult,
  createExecution,
  executeNode,
  retryExecution,
  runBatchExecutions,
  runWorkflowGraph,
  shouldRetry,
  traverseWorkflowGraph,
} from "@/lib/enterprise-workflow-engine/executor";
import {
  buildWorkflowAnalytics,
  buildWorkflowDashboard,
  computeHealthScore,
  filterExecutionsByStatus,
  topTriggers,
} from "@/lib/enterprise-workflow-engine/analytics";
import {
  WORKFLOW_ENGINE_API,
  WORKFLOW_ENGINE_ROUTES,
  WORKFLOW_NODE_TYPES,
  WORKFLOW_TRIGGER_TYPES,
} from "@/lib/enterprise-workflow-engine/registry";
import {
  computeNextCronRun,
  createSchedule,
  disableSchedule,
  enableSchedule,
  listDueSchedules,
  parseCronExpression,
  validateSchedule,
} from "@/lib/enterprise-workflow-engine/scheduler";
import {
  DEFAULT_WORKFLOW_TEMPLATES,
  getWorkflowTemplate,
  listWorkflowTemplates,
  templateToWorkflow,
} from "@/lib/enterprise-workflow-engine/templates";
import {
  bumpWorkflowVersion,
  compareVersions,
  createVersionEntry,
  detectPendingPublish,
  exportWorkflowBundle,
  importWorkflowBundle,
  publishWorkflowVersion,
  rollbackToVersion,
} from "@/lib/enterprise-workflow-engine/versioning";
import { validateWorkflowEngineReadiness } from "@/lib/enterprise-workflow-engine/reader";
import { computeWorkflowEngineHealth } from "@/lib/enterprise-workflow-engine/health";
import type { WorkflowDefinition } from "@/lib/enterprise-workflow-engine/types";

function sampleWorkflow(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  const base = createDefaultWorkflows()[0]!;
  return { ...base, ...overrides };
}

describe("workflow engine descriptor", () => {
  it("registers module id", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.id).toBe("enterprise-workflow-engine");
  });

  it("auto registers", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/workflows");
  });

  it("includes six feature flags", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.featureFlags.length).toBe(6);
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.featureFlags.some((f) => f.id === "workflow_engine_enabled")).toBe(true);
  });

  it("requires MFA for publish", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.permissions.find((p) => p.action === "publish-config")?.requiresMfa).toBe(true);
  });

  it("requires MFA for rollback", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.permissions.find((p) => p.action === "rollback-config")?.requiresMfa).toBe(true);
  });

  it("requires MFA for delete", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.permissions.find((p) => p.action === "delete")?.requiresMfa).toBe(true);
  });

  it("requires MFA for import", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.permissions.find((p) => p.action === "import-config")?.requiresMfa).toBe(true);
  });

  it("defines workflow permission roles", () => {
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.permissions.some((p) => p.action === "workflow-admin")).toBe(true);
    expect(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.permissions.some((p) => p.action === "workflow-editor")).toBe(true);
  });

  it("is in enterprise architecture registry", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-workflow-engine")).toBeDefined();
  });

  it("is discovered by registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-workflow-engine")).toBeDefined();
  });
});

describe("workflow routes and registry", () => {
  it("registers eleven admin routes", () => {
    expect(WORKFLOW_ENGINE_ROUTES.length).toBe(11);
  });

  it("includes dashboard route", () => {
    expect(WORKFLOW_ENGINE_ROUTES[0]?.href).toBe("/super-admin/workflows");
  });

  it("includes builder route", () => {
    expect(WORKFLOW_ENGINE_ROUTES.some((r) => r.id === "builder")).toBe(true);
  });

  it("registers nineteen node types", () => {
    expect(WORKFLOW_NODE_TYPES.length).toBe(19);
    expect(WORKFLOW_NODE_TYPES).toContain("approval");
    expect(WORKFLOW_NODE_TYPES).toContain("http-request");
  });

  it("registers twenty-four trigger types", () => {
    expect(WORKFLOW_TRIGGER_TYPES.length).toBe(24);
    expect(WORKFLOW_TRIGGER_TYPES).toContain("order-paid");
    expect(WORKFLOW_TRIGGER_TYPES).toContain("cron");
  });

  it("exposes snapshot API", () => {
    expect(WORKFLOW_ENGINE_API.snapshot).toBe("/api/workflows");
  });

  it("exposes v1 snapshot API", () => {
    expect(WORKFLOW_ENGINE_API.v1Snapshot).toBe("/api/v1/workflows");
  });

  it("exposes lifecycle API endpoints", () => {
    expect(WORKFLOW_ENGINE_API.run).toContain("/run");
    expect(WORKFLOW_ENGINE_API.publish).toContain("/publish");
    expect(WORKFLOW_ENGINE_API.rollback).toContain("/rollback");
    expect(WORKFLOW_ENGINE_API.export).toContain("/export");
    expect(WORKFLOW_ENGINE_API.import).toContain("/import");
  });
});

describe("workflow builder", () => {
  it("validates complete workflow graph", () => {
    const result = validateWorkflowGraph(sampleWorkflow());
    expect(result.valid).toBe(true);
  });

  it("fails when start node missing", () => {
    const wf = sampleWorkflow({ nodes: sampleWorkflow().nodes.filter((n) => n.type !== "start") });
    expect(validateWorkflowGraph(wf).valid).toBe(false);
  });

  it("validates node types", () => {
    expect(isValidNodeType("start")).toBe(true);
    expect(isValidNodeType("invalid")).toBe(false);
  });

  it("adds node to workflow", () => {
    const wf = addNodeToWorkflow(sampleWorkflow(), { id: "extra", type: "delay", label: "Wait", config: {} });
    expect(wf.nodes.some((n) => n.id === "extra")).toBe(true);
  });

  it("removes node from workflow", () => {
    const wf = removeNodeFromWorkflow(sampleWorkflow(), "end");
    expect(wf.nodes.some((n) => n.id === "end")).toBe(false);
  });

  it("clones workflow definition", () => {
    const clone = cloneWorkflowDefinition(sampleWorkflow(), "wf-clone");
    expect(clone.id).toBe("wf-clone");
    expect(clone.status).toBe("draft");
  });

  it("compares workflow nodes", () => {
    const a = sampleWorkflow();
    const b = addNodeToWorkflow(a, { id: "new-node", type: "delay", label: "Delay", config: {} });
    const diff = compareWorkflowNodes(a, b);
    expect(diff.added).toContain("new-node");
  });

  it("traverses workflow graph", () => {
    const { visited, error } = traverseWorkflowGraph(sampleWorkflow());
    expect(error).toBeUndefined();
    expect(visited.length).toBeGreaterThan(0);
  });
});

function approvalWorkflow(): WorkflowDefinition {
  const template = getWorkflowTemplate("tpl-seller-approval")!;
  return { ...templateToWorkflow(template, "admin"), approvalRequired: true };
}

describe("approval engine", () => {
  it("creates approval chain", () => {
    const chain = createApprovalChain("exec-1", approvalWorkflow());
    expect(chain.length).toBeGreaterThan(0);
  });

  it("resolves pending approval status", () => {
    const chain = createApprovalChain("exec-1", approvalWorkflow());
    expect(resolveApprovalStatus(chain)).toBe("pending");
  });

  it("approves step", () => {
    const chain = createApprovalChain("exec-1", approvalWorkflow());
    const approved = approveStep(chain, chain[0]!.id, "admin");
    expect(approved[0]?.status).toBe("approved");
  });

  it("rejects step", () => {
    const chain = createApprovalChain("exec-1", approvalWorkflow());
    const rejected = rejectStep(chain, chain[0]!.id, "admin");
    expect(resolveApprovalStatus(rejected)).toBe("rejected");
  });

  it("handles approval timeout", () => {
    const chain = createApprovalChain("exec-1", approvalWorkflow()).map((s) => ({
      ...s,
      timeoutAt: new Date(Date.now() - 1000).toISOString(),
    }));
    const timed = timeoutExpiredSteps(chain);
    expect(timed.some((s) => s.status === "timeout")).toBe(true);
  });

  it("supports parallel approval mode", () => {
    const chain = createApprovalChain("exec-1", sampleWorkflow(), "parallel");
    expect(chain.every((s) => s.mode === "parallel")).toBe(true);
  });
});

describe("scheduler", () => {
  it("parses valid cron expression", () => {
    expect(parseCronExpression("0 8 * * *").valid).toBe(true);
  });

  it("rejects invalid cron expression", () => {
    expect(parseCronExpression("invalid").valid).toBe(false);
  });

  it("creates schedule", () => {
    const schedule = createSchedule("wf-1", "0 8 * * *");
    expect(schedule.enabled).toBe(true);
  });

  it("computes next cron run", () => {
    expect(computeNextCronRun("0 8 * * *").length).toBeGreaterThan(0);
  });

  it("disables schedule", () => {
    expect(disableSchedule(createSchedule("wf-1", "0 8 * * *")).enabled).toBe(false);
  });

  it("enables schedule", () => {
    const disabled = disableSchedule(createSchedule("wf-1", "0 8 * * *"));
    expect(enableSchedule(disabled).enabled).toBe(true);
  });

  it("lists due schedules", () => {
    const schedule = { ...createSchedule("wf-1", "0 8 * * *"), nextRunAt: new Date(Date.now() - 1000).toISOString() };
    expect(listDueSchedules([schedule]).length).toBe(1);
  });

  it("validates schedule", () => {
    expect(validateSchedule(createSchedule("wf-1", "0 8 * * *")).valid).toBe(true);
  });
});

describe("executor and retry", () => {
  it("executes start node", () => {
    expect(executeNode({ id: "s", type: "start", label: "Start", config: {} }).ok).toBe(true);
  });

  it("executes http-request node", () => {
    expect(executeNode({ id: "h", type: "http-request", label: "HTTP", config: { method: "POST" } }).ok).toBe(true);
  });

  it("runs workflow graph", () => {
    const result = runWorkflowGraph(sampleWorkflow(), "exec-test");
    expect(result.executionId).toBe("exec-test");
    expect(result.visitedNodes.length).toBeGreaterThan(0);
  });

  it("creates execution record", () => {
    const exec = createExecution(sampleWorkflow());
    expect(exec.status).toBe("queued");
  });

  it("applies execution result", () => {
    const exec = createExecution(sampleWorkflow());
    const result = runWorkflowGraph(sampleWorkflow(), exec.id);
    const applied = applyExecutionResult(exec, result);
    expect(applied.runtimeMs).toBeDefined();
  });

  it("should retry failed execution", () => {
    const exec = { ...createExecution(sampleWorkflow()), status: "failed" as const, attempt: 1 };
    expect(shouldRetry(exec, 3)).toBe(true);
  });

  it("retries execution with delay", () => {
    const exec = { ...createExecution(sampleWorkflow()), status: "failed" as const, attempt: 1 };
    const retried = retryExecution(exec, 5000);
    expect(retried.status).toBe("retrying");
    expect(retried.attempt).toBe(2);
  });

  it("runs batch executions", () => {
    const workflows = createDefaultWorkflows();
    const results = runBatchExecutions(workflows, workflows.map((w) => w.id));
    expect(results.length).toBe(workflows.length);
  });
});

describe("versioning import export", () => {
  it("creates version entry", () => {
    const entry = createVersionEntry(sampleWorkflow(), "admin", "Initial publish");
    expect(entry.rollbackAvailable).toBe(true);
  });

  it("bumps patch version", () => {
    expect(bumpWorkflowVersion(sampleWorkflow()).version).toBe("1.0.1");
  });

  it("publishes workflow version", () => {
    const { workflow } = publishWorkflowVersion(sampleWorkflow(), "admin");
    expect(workflow.status).toBe("published");
  });

  it("detects pending publish", () => {
    const a = createDefaultWorkflows();
    const b = [...a, templateToWorkflow(DEFAULT_WORKFLOW_TEMPLATES[0]!, "admin")];
    expect(detectPendingPublish(b, a)).toBe(true);
  });

  it("compares versions", () => {
    const compare = compareVersions(sampleWorkflow(), bumpWorkflowVersion(sampleWorkflow()));
    expect(compare.fromVersion).toBe("1.0.0");
  });

  it("exports workflow bundle", () => {
    const bundle = exportWorkflowBundle(createDefaultWorkflows(), []);
    expect(bundle.workflows.length).toBeGreaterThan(0);
  });

  it("imports workflow bundle", () => {
    const existing = createDefaultWorkflows();
    const imported = importWorkflowBundle({ workflows: [templateToWorkflow(DEFAULT_WORKFLOW_TEMPLATES[3]!, "admin")] }, existing);
    expect(imported.length).toBeGreaterThan(existing.length);
  });

  it("rolls back to version", () => {
    const workflows = createDefaultWorkflows();
    const entry = createVersionEntry(workflows[0]!, "admin", "v1");
    const { workflows: rolled } = rollbackToVersion(workflows, [entry], entry.id);
    expect(rolled[0]?.version).toBe(entry.version);
  });
});

describe("analytics and dashboard", () => {
  it("builds workflow analytics", () => {
    const state = createDefaultWorkflowEngineState();
    const analytics = buildWorkflowAnalytics(state.executions, []);
    expect(analytics.executionCount).toBeGreaterThan(0);
  });

  it("builds dashboard metrics", () => {
    const state = createDefaultWorkflowEngineState();
    const analytics = buildWorkflowAnalytics(state.executions, []);
    const dashboard = buildWorkflowDashboard(state.workflows, state.executions, [], state.schedules.length, analytics);
    expect(dashboard.totalWorkflows).toBeGreaterThan(0);
  });

  it("filters executions by status", () => {
    const execs = createDefaultExecutions(createDefaultWorkflows());
    expect(filterExecutionsByStatus(execs, "completed").length).toBeGreaterThan(0);
  });

  it("computes top triggers", () => {
    const analytics = buildWorkflowAnalytics(createDefaultExecutions(createDefaultWorkflows()), []);
    expect(topTriggers(analytics).length).toBeGreaterThan(0);
  });

  it("computes health score", () => {
    const analytics = buildWorkflowAnalytics(createDefaultExecutions(createDefaultWorkflows()), []);
    expect(computeHealthScore(analytics, true)).toBeGreaterThan(0);
  });
});

describe("templates and engine state", () => {
  it("lists default templates", () => {
    expect(DEFAULT_WORKFLOW_TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });

  it("gets template by id", () => {
    expect(getWorkflowTemplate("tpl-order-paid")).toBeDefined();
  });

  it("filters templates by category", () => {
    expect(listWorkflowTemplates("commerce").length).toBeGreaterThan(0);
  });

  it("converts template to workflow", () => {
    const wf = templateToWorkflow(DEFAULT_WORKFLOW_TEMPLATES[0]!, "admin");
    expect(wf.status).toBe("draft");
  });

  it("creates default settings", () => {
    expect(createDefaultWorkflowEngineSettings().maxConcurrentExecutions).toBe(50);
  });

  it("creates default state", () => {
    const state = createDefaultWorkflowEngineState();
    expect(state.workflows.length).toBeGreaterThan(0);
  });

  it("finds workflow by id", () => {
    const wf = createDefaultWorkflows()[0]!;
    expect(findWorkflow(createDefaultWorkflows(), wf.id)?.id).toBe(wf.id);
  });

  it("upserts workflow", () => {
    const workflows = createDefaultWorkflows();
    const updated = upsertWorkflow(workflows, { ...workflows[0]!, name: "Updated" });
    expect(updated[0]?.name).toBe("Updated");
  });

  it("deletes workflow", () => {
    const workflows = createDefaultWorkflows();
    expect(deleteWorkflow(workflows, workflows[0]!.id).length).toBe(workflows.length - 1);
  });
});

describe("permissions audit and health", () => {
  it("allows view for super-admin", () => {
    expect(canPerformWorkflowAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires MFA for publish action", () => {
    expect(requiresMfa("publish")).toBe(true);
  });

  it("requires MFA for import action", () => {
    expect(requiresMfa("import")).toBe(true);
  });

  it("resolves admin role for publish", () => {
    expect(resolveWorkflowRole("publish")).toBe("workflow-admin");
  });

  it("resolves operator role for run", () => {
    expect(resolveWorkflowRole("run")).toBe("workflow-operator");
  });

  it("validates engine readiness", () => {
    const state = createDefaultWorkflowEngineState();
    const analytics = buildWorkflowAnalytics(state.executions, []);
    const dashboard = buildWorkflowDashboard(state.workflows, state.executions, [], 0, analytics);
    const readiness = validateWorkflowEngineReadiness({
      tab: "dashboard",
      dashboard,
      analytics,
      workflows: state.workflows,
      templates: DEFAULT_WORKFLOW_TEMPLATES,
      executions: state.executions,
      approvals: [],
      schedules: state.schedules,
      versions: [],
      history: [],
      auditLog: [],
      featureFlags: { workflow_engine_enabled: true },
      pendingPublish: false,
      health: { status: "healthy", score: 90, message: "ok" },
    });
    expect(readiness.score).toBeGreaterThan(0);
  });

  it("computes workflow engine health", () => {
    const health = computeWorkflowEngineHealth({
      health: { status: "healthy", score: 90, message: "ok" },
      featureFlags: { workflow_engine_enabled: true },
      dashboard: { totalWorkflows: 3, healthScore: 90 } as never,
    });
    expect(health.score).toBe(90);
  });
});

describe("registry v2 integration", () => {
  it("discovered module has routes", () => {
    const mod = getDiscoveredModuleV2("enterprise-workflow-engine");
    expect(mod?.routes.length).toBeGreaterThan(0);
  });

  it("discovered module has feature flags", () => {
    const mod = getDiscoveredModuleV2("enterprise-workflow-engine");
    expect(mod?.featureFlags.some((f) => f.id === "scheduler_enabled")).toBe(true);
  });

  it("discovered module depends on enterprise core", () => {
    const mod = getDiscoveredModuleV2("enterprise-workflow-engine");
    expect(mod?.dependencies).toContain("enterprise-core");
  });

  it("discovered module has configuration schema", () => {
    const mod = getDiscoveredModuleV2("enterprise-workflow-engine");
    expect(mod?.configurationSchema.draftKey).toContain("enterprise_workflow_engine");
  });
});

describe("history and API coverage", () => {
  it("exposes history API path", () => {
    expect(WORKFLOW_ENGINE_API.history).toBe("/api/workflows/history");
  });

  it("exposes templates API path", () => {
    expect(WORKFLOW_ENGINE_API.templates).toBe("/api/workflows/templates");
  });

  it("exposes super admin action path", () => {
    expect(WORKFLOW_ENGINE_API.superAdminAction).toContain("/super-admin/workflows/action");
  });

  it("includes settings route", () => {
    expect(WORKFLOW_ENGINE_ROUTES.some((r) => r.id === "settings")).toBe(true);
  });

  it("includes executions route", () => {
    expect(WORKFLOW_ENGINE_ROUTES.some((r) => r.id === "executions")).toBe(true);
  });

  it("includes approvals route", () => {
    expect(WORKFLOW_ENGINE_ROUTES.some((r) => r.id === "approvals")).toBe(true);
  });

  it("bumps minor version", () => {
    expect(bumpWorkflowVersion(sampleWorkflow(), "minor").version).toBe("1.1.0");
  });

  it("bumps major version", () => {
    expect(bumpWorkflowVersion(sampleWorkflow(), "major").version).toBe("2.0.0");
  });
});
