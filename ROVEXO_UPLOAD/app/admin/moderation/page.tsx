import { ModerationDashboard } from "@/features/admin/components/ModerationDashboard";
import { listModerationAuditLogs, listModerationQueue } from "@/lib/moderation/service";

export default async function AdminModerationPage() {
  const [queue, auditLogs] = await Promise.all([
    listModerationQueue(100),
    listModerationAuditLogs(undefined, 100),
  ]);

  return <ModerationDashboard initialQueue={queue} initialAuditLogs={auditLogs} />;
}
