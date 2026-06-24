import { ModerationDashboard } from "@/features/admin/components/ModerationDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { listModerationAuditLogs, listModerationQueue } from "@/lib/moderation/service";

export default async function SuperAdminModerationPage() {
  const [queue, auditLogs] = await Promise.all([
    listModerationQueue(100),
    listModerationAuditLogs(undefined, 100),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Moderation" description="Content moderation queue and audit trail." />
      <ModerationDashboard initialQueue={queue} initialAuditLogs={auditLogs} />
    </>
  );
}
