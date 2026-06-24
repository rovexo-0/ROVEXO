import { SuperAdminAuditLog } from "@/features/super-admin/components/SuperAdminAuditLog";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminAuditPage() {
  return (
    <>
      <SuperAdminPageHeader title="Audit Logs" description="Full Super Admin action history." />
      <SuperAdminAuditLog />
    </>
  );
}
