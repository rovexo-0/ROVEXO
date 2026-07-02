import { createAdminClient } from "@/lib/supabase/admin";
import { getAuditComplianceEngineSnapshot } from "@/lib/audit-compliance-engine/reader";
import { getCertificationCenterEngineSnapshot } from "@/lib/certification-center-engine/reader";
import { getIncidentReports } from "@/lib/incident-command-center-engine/engine";
import { getIncidentTimelineExports } from "@/lib/incident-timeline-engine/engine";
import type { AuditEngineSnapshot } from "@/lib/audit-compliance-engine/types";
import type { CertificationEngineSnapshot } from "@/lib/certification-center-engine/types";

export type EnterpriseComplianceLiveContext = {
  auditSnapshot: AuditEngineSnapshot;
  certificationSnapshot: CertificationEngineSnapshot;
  auditLogs: Array<{
    id: string;
    action: string;
    actorId: string | null;
    resourceType: string;
    resourceId: string | null;
    metadata: unknown;
    createdAt: string;
  }> | null;
  auditLogsError: string | null;
  incidentReports: Awaited<ReturnType<typeof getIncidentReports>>;
  timelineExports: Awaited<ReturnType<typeof getIncidentTimelineExports>>;
};

async function safe<T>(run: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await run(), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Unavailable" };
  }
}

export async function fetchEnterpriseComplianceLiveContext(): Promise<EnterpriseComplianceLiveContext> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString();

  const [auditSnapshot, certificationSnapshot, incidentReports, timelineExports, auditLogs] = await Promise.all([
    getAuditComplianceEngineSnapshot(),
    getCertificationCenterEngineSnapshot(),
    getIncidentReports(),
    getIncidentTimelineExports(),
    safe(async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("platform_audit_logs")
        .select("id, action, actor_id, resource_type, resource_id, metadata, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
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
    auditSnapshot,
    certificationSnapshot,
    auditLogs: auditLogs.data,
    auditLogsError: auditLogs.error,
    incidentReports,
    timelineExports,
  };
}
