import { SuperAdminCommandCentre } from "@/features/super-admin/components/SuperAdminCommandCentre";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getSuperAdminDiagnosticsSnapshot } from "@/lib/super-admin/dashboard";

export default async function SuperAdminCommandPage() {
  const diagnostics = await getSuperAdminDiagnosticsSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Command Centre"
        description="Emergency and high-impact actions with full audit logging."
      />
      <SuperAdminCommandCentre diagnostics={diagnostics} />
    </>
  );
}
