import { RecoveryCenterAdmin } from "@/features/super-admin/recovery-center/RecoveryCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getRecoveryCenterPageData } from "@/lib/recovery-center-engine/reader";

export default async function SuperAdminRecoverySafeModePage() {
  const { snapshot } = await getRecoveryCenterPageData();

  return (
    <>
      <SuperAdminPageHeader title="Safe Mode" description="Emergency safe mode and business continuity controls." />
      <RecoveryCenterAdmin initialSnapshot={snapshot} defaultTab="safe-mode" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Safe Mode | ROVEXO Recovery", robots: { index: false, follow: false } };
}
