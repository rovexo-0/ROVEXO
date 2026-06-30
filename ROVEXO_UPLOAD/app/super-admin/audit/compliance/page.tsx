import { AuditComplianceCenterAdmin } from "@/features/super-admin/audit-compliance/AuditComplianceCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAuditCompliancePageData } from "@/lib/audit-compliance-engine/reader";

export default async function SuperAdminAuditComplianceTabPage() {
  const { snapshot } = await getAuditCompliancePageData();
  return (
    <>
      <SuperAdminPageHeader title="Compliance Center" description="GDPR, ISO 27001, SOC 2, Cyber Essentials, and ROVEXO Trust Framework readiness." />
      <AuditComplianceCenterAdmin initialSnapshot={snapshot} defaultTab="compliance" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Compliance Center | ROVEXO", robots: { index: false, follow: false } };
}
