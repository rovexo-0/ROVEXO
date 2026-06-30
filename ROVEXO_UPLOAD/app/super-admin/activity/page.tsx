import { SuperAdminAuditLog } from "@/features/super-admin/components/SuperAdminAuditLog";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminActivityPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Activity Timeline"
        description="Recent Super Admin and platform audit events."
      />
      <SuperAdminAuditLog />
    </>
  );
}
