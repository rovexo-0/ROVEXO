import { OperationsCenterAdmin } from "@/features/super-admin/operations-center/OperationsCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOperationsCenterPageData } from "@/lib/operations-center-engine/reader";

export default async function SuperAdminOperationsMaintenancePage() {
  const { snapshot } = await getOperationsCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Maintenance Center" description="Scheduled and emergency maintenance controls." />
      <OperationsCenterAdmin initialSnapshot={snapshot} defaultTab="maintenance" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Operations Maintenance | ROVEXO", robots: { index: false, follow: false } };
}
