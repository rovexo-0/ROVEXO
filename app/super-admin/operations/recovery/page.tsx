import { OperationsCenterAdmin } from "@/features/super-admin/operations-center/OperationsCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOperationsCenterPageData } from "@/lib/operations-center-engine/reader";

export default async function SuperAdminOperationsRecoveryPage() {
  const { snapshot } = await getOperationsCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Recovery Center" description="Automated recovery actions for production operations." />
      <OperationsCenterAdmin initialSnapshot={snapshot} defaultTab="recovery" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Operations Recovery | ROVEXO", robots: { index: false, follow: false } };
}
