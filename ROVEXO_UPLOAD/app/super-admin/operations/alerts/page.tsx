import { OperationsCenterAdmin } from "@/features/super-admin/operations-center/OperationsCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOperationsCenterPageData } from "@/lib/operations-center-engine/reader";

export default async function SuperAdminOperationsAlertsPage() {
  const { snapshot } = await getOperationsCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Operations Alerts" description="Enterprise alert center for production incidents." />
      <OperationsCenterAdmin initialSnapshot={snapshot} defaultTab="alerts" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Operations Alerts | ROVEXO", robots: { index: false, follow: false } };
}
