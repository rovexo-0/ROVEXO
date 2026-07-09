import type { AuditLogEntry, RuleExecutionResult } from "@/lib/marketplace-os/types";
import type { RuleContext } from "@/lib/marketplace-os/rules";

let inMemoryAuditLog: AuditLogEntry[] = [];

/** Audit Engine — logs every automatic decision with rollback metadata. */
export function createAuditEntry(input: {
  ruleId: string;
  ruleVersion: number;
  inputs: RuleContext;
  outputs: RuleExecutionResult;
  reason: string;
  previousState?: string;
  newState?: string;
}): AuditLogEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ruleId: input.ruleId,
    ruleVersion: input.ruleVersion,
    inputs: input.inputs,
    outputs: {
      matched: input.outputs.matched,
      actionsExecuted: input.outputs.actionsExecuted,
      reason: input.outputs.reason,
    },
    reason: input.reason,
    previousState: input.previousState,
    newState: input.newState,
    rollbackAvailable: Boolean(input.previousState),
  };
}

export function appendAuditEntries(entries: AuditLogEntry[], maxEntries = 500): AuditLogEntry[] {
  inMemoryAuditLog = [...entries, ...inMemoryAuditLog].slice(0, maxEntries);
  return inMemoryAuditLog;
}

export function getRecentAuditLog(limit = 50): AuditLogEntry[] {
  return inMemoryAuditLog.slice(0, limit);
}

export function auditRuleExecutions(
  results: RuleExecutionResult[],
  context: RuleContext,
  previousState?: string,
): AuditLogEntry[] {
  return results
    .filter((result) => result.matched && result.actionsExecuted.length > 0)
    .map((result) =>
      createAuditEntry({
        ruleId: result.ruleId,
        ruleVersion: result.ruleVersion,
        inputs: context,
        outputs: result,
        reason: result.reason,
        previousState,
        newState: result.actionsExecuted.map((action) => action.type).join(","),
      }),
    );
}

export function clearAuditLogForTests(): void {
  inMemoryAuditLog = [];
}
