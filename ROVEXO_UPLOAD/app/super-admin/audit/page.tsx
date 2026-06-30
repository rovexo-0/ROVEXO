import { AuditComplianceCenterAdmin } from "@/features/super-admin/audit-compliance/AuditComplianceCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAuditCompliancePageData } from "@/lib/audit-compliance-engine/reader";

export default async function SuperAdminAuditCompliancePage() {
  const { snapshot } = await getAuditCompliancePageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Audit & Compliance Center"
        description="Enterprise production certification, compliance validation, and readiness reporting."
      />
      <AuditComplianceCenterAdmin initialSnapshot={snapshot} defaultTab="dashboard" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Audit & Compliance Center | ROVEXO",
    robots: { index: false, follow: false },
  };
}
