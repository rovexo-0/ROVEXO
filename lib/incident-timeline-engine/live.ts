import { createAdminClient } from "@/lib/supabase/admin";
import { fetchIncidentLiveContext } from "@/lib/incident-command-center-engine/live";
import { getIncidentHistory, getIncidentStateOverrides } from "@/lib/incident-command-center-engine/engine";
import { getOperationsIncidents } from "@/lib/operations-center-engine/engine";
import type { OperationsIncident } from "@/lib/operations-center-engine/types";
import type { IncidentHistoryEvent } from "@/lib/incident-command-center-engine/types";

export type IncidentTimelineLiveContext = Awaited<ReturnType<typeof fetchIncidentLiveContext>> & {
  overrides: Awaited<ReturnType<typeof getIncidentStateOverrides>>;
  incidentHistory: IncidentHistoryEvent[];
  operationsIncidentsFull: OperationsIncident[] | null;
  operationsError: string | null;
  auditLogs: Array<{
    id: string;
    action: string;
    actorId: string | null;
    resourceType: string;
    resourceId: string | null;
    metadata: unknown;
    createdAt: string;
  }> | null;
  auditError: string | null;
};

async function safe<T>(run: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await run(), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Unavailable" };
  }
}

export async function fetchIncidentTimelineLiveContext(): Promise<IncidentTimelineLiveContext> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString();

  const [liveCtx, overrides, incidentHistory, operationsIncidents, auditLogs] = await Promise.all([
    fetchIncidentLiveContext(),
    getIncidentStateOverrides(),
    getIncidentHistory(),
    safe(getOperationsIncidents),
    safe(async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("platform_audit_logs")
        .select("id, action, actor_id, resource_type, resource_id, metadata, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id,
        action: row.action,
        actorId: row.actor_id,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    }),
  ]);

  return {
    ...liveCtx,
    overrides,
    incidentHistory,
    operationsIncidentsFull: operationsIncidents.data,
    operationsError: operationsIncidents.error,
    auditLogs: auditLogs.data,
    auditError: auditLogs.error,
  };
}
