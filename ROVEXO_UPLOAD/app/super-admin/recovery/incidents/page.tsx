import { RecoveryCenterAdmin } from "@/features/super-admin/recovery-center/RecoveryCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getRecoveryCenterPageData } from "@/lib/recovery-center-engine/reader";

export default async function SuperAdminRecoveryIncidentsPage() {
  const { snapshot } = await getRecoveryCenterPageData();

  return (
    <>
      <SuperAdminPageHeader title="Incident Response" description="Recovery incidents, checklists, and closure reports." />
      <RecoveryCenterAdmin initialSnapshot={snapshot} defaultTab="incidents" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Recovery Incidents | ROVEXO Recovery", robots: { index: false, follow: false } };
}
