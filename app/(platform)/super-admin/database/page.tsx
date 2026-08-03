import { DatabaseCommandCenter } from "@/features/super-admin/database-command-center/DatabaseCommandCenter";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getDatabaseHealthSnapshot } from "@/lib/super-admin/database-health/snapshot";

export default async function SuperAdminDatabasePage() {
  const snapshot = await getDatabaseHealthSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Database Command Center"
        description="Production database health — migrations, core tables, storage, and RLS status."
      />
      <DatabaseCommandCenter snapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Database Command Center | ROVEXO",
    robots: { index: false, follow: false },
  };
}
