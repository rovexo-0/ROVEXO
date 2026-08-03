import { RecoveryCenterAdmin } from "@/features/super-admin/recovery-center/RecoveryCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getRecoveryCenterPageData } from "@/lib/recovery-center-engine/reader";

export default async function SuperAdminRecoveryHistoryPage() {
  const { snapshot } = await getRecoveryCenterPageData();

  return (
    <>
      <SuperAdminPageHeader title="Recovery History" description="Backup, restore, rollback, and validation timeline." />
      <RecoveryCenterAdmin initialSnapshot={snapshot} defaultTab="history" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Recovery History | ROVEXO Recovery", robots: { index: false, follow: false } };
}
