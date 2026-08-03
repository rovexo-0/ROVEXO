import { RecoveryCenterAdmin } from "@/features/super-admin/recovery-center/RecoveryCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getRecoveryCenterPageData } from "@/lib/recovery-center-engine/reader";

export default async function SuperAdminRecoveryBackupsPage() {
  const { snapshot } = await getRecoveryCenterPageData();

  return (
    <>
      <SuperAdminPageHeader title="Backup Center" description="Full, incremental, and encrypted platform backups." />
      <RecoveryCenterAdmin initialSnapshot={snapshot} defaultTab="backups" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Backup Center | ROVEXO Recovery", robots: { index: false, follow: false } };
}
