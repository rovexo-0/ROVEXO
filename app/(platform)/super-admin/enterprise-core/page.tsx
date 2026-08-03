import { EnterpriseCore } from "@/features/super-admin/enterprise-core/EnterpriseCore";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getEnterpriseCoreSnapshot } from "@/lib/enterprise-core/snapshot";

export default async function SuperAdminEnterpriseCorePage() {
  const snapshot = await getEnterpriseCoreSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Enterprise Core"
        description="Unified enterprise operating system — registry, search, settings, dashboard, audit, backup, permissions, health, analytics, AI, operations, and recovery."
      />
      <EnterpriseCore initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Enterprise Core | ROVEXO",
    robots: { index: false, follow: false },
  };
}
