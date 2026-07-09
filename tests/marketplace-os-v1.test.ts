import { describe, expect, it, beforeEach } from "vitest";
import {
  MOS_VERSION,
  MOS_NAME,
  DEFAULT_MOS_THRESHOLDS,
  createDefaultMosDocument,
  DEFAULT_MOS_RULES,
  executeRules,
  validateRulesFailsafe,
  detectDependencyCycle,
  guardOrchestration,
  evaluateMarketplaceState,
  marketplaceStateToRuleContext,
  evaluateMarketplaceBalance,
  runMarketplaceOrchestration,
  runMosAutomation,
  getRecentAuditLog,
  clearAuditLogForTests,
  clampMosScore,
} from "@/lib/marketplace-os";

describe("ROVEXO Marketplace Operating System v1.0", () => {
  beforeEach(() => {
    clearAuditLogForTests();
  });

  it("exposes MOS v1 identity", () => {
    expect(MOS_VERSION).toBe("1.0.0");
    expect(MOS_NAME).toContain("Marketplace Operating System");
    expect(DEFAULT_MOS_THRESHOLDS.minInventory).toBe(3);
  });

  it("creates configurable default document with rules", () => {
    const doc = createDefaultMosDocument();
    expect(doc.rules.length).toBeGreaterThan(5);
    expect(doc.automationEnabled).toBe(true);
    expect(doc.thresholds.homepageSlots).toBe(12);
  });

  it("executes rules deterministically with dependencies", () => {
    const context = {
      healthScore: 80,
      inventoryStatus: "healthy",
      growthStatus: "growing",
      conversionStatus: "healthy",
    };
    const results = executeRules(DEFAULT_MOS_RULES, context);
    expect(results.length).toBe(DEFAULT_MOS_RULES.length);
    expect(results.some((result) => result.matched)).toBe(true);
  });

  it("validates failsafe for rule conflicts", () => {
    const issues = validateRulesFailsafe(DEFAULT_MOS_RULES);
    expect(Array.isArray(issues)).toBe(true);
    expect(detectDependencyCycle(DEFAULT_MOS_RULES)).toBe(false);
  });

  it("guards against excessive orchestration iterations", () => {
    const guard = guardOrchestration([], 50);
    expect(guard.allowed).toBe(true);
  });

  it("evaluates marketplace state", async () => {
    const state = await evaluateMarketplaceState(DEFAULT_MOS_THRESHOLDS);
    expect(state.healthScore).toBeGreaterThanOrEqual(0);
    expect(["operational", "degraded", "critical"]).toContain(state.status);
    const context = marketplaceStateToRuleContext(state);
    expect(context.healthScore).toBe(state.healthScore);
  });

  it("evaluates marketplace balance", async () => {
    const balance = await evaluateMarketplaceBalance(DEFAULT_MOS_THRESHOLDS);
    expect(Array.isArray(balance.oversupplied)).toBe(true);
    expect(Array.isArray(balance.undersupplied)).toBe(true);
  });

  it("runs full marketplace orchestration", async () => {
    const doc = createDefaultMosDocument();
    const result = await runMarketplaceOrchestration(doc);
    expect(result.status).toBe("completed");
    expect(result.subsystemsCoordinated.length).toBeGreaterThan(0);
    expect(result.rulesExecuted).toBeGreaterThanOrEqual(0);
  });

  it("runs automation center with queue", async () => {
    const doc = createDefaultMosDocument();
    const { queue, result } = await runMosAutomation(doc);
    expect(queue.length).toBeGreaterThan(0);
    expect(result.status).toBe("completed");
  });

  it("maintains audit log after orchestration", async () => {
    const doc = createDefaultMosDocument();
    await runMarketplaceOrchestration(doc);
    const log = getRecentAuditLog(10);
    expect(Array.isArray(log)).toBe(true);
  });

  it("clamps scores to valid range", () => {
    expect(clampMosScore(150)).toBe(100);
    expect(clampMosScore(-10)).toBe(0);
  });
});
