import { RecoveryCenterAdmin } from "@/features/super-admin/recovery-center/RecoveryCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getRecoveryCenterPageData } from "@/lib/recovery-center-engine/reader";

export default async function SuperAdminRecoveryPage() {
  const { snapshot } = await getRecoveryCenterPageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Recovery Center"
        description="Enterprise disaster recovery, business continuity, backup, rollback, and safe mode."
      />
      <RecoveryCenterAdmin initialSnapshot={snapshot} defaultTab="dashboard" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Recovery Center | ROVEXO",
    robots: { index: false, follow: false },
  };
}
