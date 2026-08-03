import { OperationsCenterAdmin } from "@/features/super-admin/operations-center/OperationsCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOperationsCenterPageData } from "@/lib/operations-center-engine/reader";

export default async function SuperAdminOperationsLogsPage() {
  const { snapshot } = await getOperationsCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Operations Logs" description="Application, API, security, and audit logs." />
      <OperationsCenterAdmin initialSnapshot={snapshot} defaultTab="logs" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Operations Logs | ROVEXO", robots: { index: false, follow: false } };
}
