import { SuperAdminAuditLog } from "@/features/super-admin/components/SuperAdminAuditLog";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminAuditLogsPage() {
  return (
    <>
      <SuperAdminPageHeader title="Audit Logs" description="Full Super Admin action history." />
      <SuperAdminAuditLog />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Audit Logs | ROVEXO",
    robots: { index: false, follow: false },
  };
}
