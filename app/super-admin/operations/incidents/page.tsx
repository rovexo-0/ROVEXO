import { OperationsCenterAdmin } from "@/features/super-admin/operations-center/OperationsCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOperationsCenterPageData } from "@/lib/operations-center-engine/reader";

export default async function SuperAdminOperationsIncidentsPage() {
  const { snapshot } = await getOperationsCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Operations Incidents" description="Enterprise incident manager with timeline and recovery." />
      <OperationsCenterAdmin initialSnapshot={snapshot} defaultTab="incidents" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Operations Incidents | ROVEXO", robots: { index: false, follow: false } };
}
