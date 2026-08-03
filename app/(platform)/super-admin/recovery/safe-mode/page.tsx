import { RecoveryCenterAdmin } from "@/features/super-admin/recovery-center/RecoveryCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import {
  getRecoveryCenterOfflineSnapshot,
  getRecoveryCenterPageData,
} from "@/lib/recovery-center-engine/reader";

export const dynamic = "force-dynamic";

export default async function SuperAdminRecoverySafeModePage() {
  let snapshot;
  try {
    ({ snapshot } = await getRecoveryCenterPageData());
  } catch {
    snapshot = getRecoveryCenterOfflineSnapshot();
  }

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
