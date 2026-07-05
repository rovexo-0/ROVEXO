import type { WorkflowSchedule } from "@/lib/enterprise-workflow-engine/types";

export function parseCronExpression(cron: string): { valid: boolean; parts: string[] } {
  const parts = cron.trim().split(/\s+/);
  return { valid: parts.length >= 5, parts };
}

export function computeNextCronRun(cron: string, from = new Date()): string {
  const { valid } = parseCronExpression(cron);
  if (!valid) return from.toISOString();
  const next = new Date(from);
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return next.toISOString();
}

export function createSchedule(workflowId: string, cron: string, timezone = "UTC"): WorkflowSchedule {
  return {
    id: `sched-${workflowId}-${Date.now()}`,
    workflowId,
    cron,
    timezone,
    enabled: true,
    nextRunAt: computeNextCronRun(cron),
    lastRunAt: undefined,
  };
}

export function disableSchedule(schedule: WorkflowSchedule): WorkflowSchedule {
  return { ...schedule, enabled: false };
}

export function enableSchedule(schedule: WorkflowSchedule): WorkflowSchedule {
  return { ...schedule, enabled: true, nextRunAt: computeNextCronRun(schedule.cron) };
}

export function markScheduleRun(schedule: WorkflowSchedule): WorkflowSchedule {
  const ranAt = new Date().toISOString();
  return {
    ...schedule,
    lastRunAt: ranAt,
    nextRunAt: computeNextCronRun(schedule.cron),
  };
}

export function listDueSchedules(schedules: WorkflowSchedule[], now = Date.now()): WorkflowSchedule[] {
  return schedules.filter(
    (s) => s.enabled && new Date(s.nextRunAt).getTime() <= now,
  );
}

export function validateSchedule(schedule: WorkflowSchedule): { valid: boolean; error?: string } {
  const { valid } = parseCronExpression(schedule.cron);
  if (!valid) return { valid: false, error: "Invalid cron expression" };
  if (!schedule.workflowId) return { valid: false, error: "Missing workflowId" };
  return { valid: true };
}
