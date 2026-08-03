import { SuperAdminGrantsPanel } from "@/features/super-admin/components/SuperAdminGrantsPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminGrantsPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Free Benefits"
        description="Grant featured listings, bumps, premium, wallet balance, and credits without payment."
      />
      <SuperAdminGrantsPanel />
    </>
  );
}
