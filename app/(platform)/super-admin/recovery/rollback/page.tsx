import { RecoveryCenterAdmin } from "@/features/super-admin/recovery-center/RecoveryCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getRecoveryCenterPageData } from "@/lib/recovery-center-engine/reader";

export default async function SuperAdminRecoveryRollbackPage() {
  const { snapshot } = await getRecoveryCenterPageData();

  return (
    <>
      <SuperAdminPageHeader title="Rollback Center" description="Rollback homepage, themes, CMS, assets, and configuration." />
      <RecoveryCenterAdmin initialSnapshot={snapshot} defaultTab="rollback" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Rollback Center | ROVEXO Recovery", robots: { index: false, follow: false } };
}
