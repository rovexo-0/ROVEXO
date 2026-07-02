import { OperationsCenterAdmin } from "@/features/super-admin/operations-center/OperationsCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOperationsCenterPageData } from "@/lib/operations-center-engine/reader";

export default async function SuperAdminOperationsPage() {
  const { snapshot } = await getOperationsCenterPageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Operations Center"
        description="Enterprise NOC — live platform monitoring, alerts, incidents, maintenance, and recovery."
      />
      <OperationsCenterAdmin initialSnapshot={snapshot} defaultTab="dashboard" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Operations Center | ROVEXO",
    robots: { index: false, follow: false },
  };
}
