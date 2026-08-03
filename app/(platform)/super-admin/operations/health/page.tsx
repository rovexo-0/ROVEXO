import { OperationsCenterAdmin } from "@/features/super-admin/operations-center/OperationsCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOperationsCenterPageData } from "@/lib/operations-center-engine/reader";

export default async function SuperAdminOperationsHealthPage() {
  const { snapshot } = await getOperationsCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Operations Health" description="Live service health and system monitor." />
      <OperationsCenterAdmin initialSnapshot={snapshot} defaultTab="health" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Operations Health | ROVEXO", robots: { index: false, follow: false } };
}
