import { AuditComplianceCenterAdmin } from "@/features/super-admin/audit-compliance/AuditComplianceCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAuditCompliancePageData } from "@/lib/audit-compliance-engine/reader";

export default async function SuperAdminAuditReportsPage() {
  const { snapshot } = await getAuditCompliancePageData();
  return (
    <>
      <SuperAdminPageHeader title="Certification Reports" description="Production, security, performance, compliance, and executive reports." />
      <AuditComplianceCenterAdmin initialSnapshot={snapshot} defaultTab="reports" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Audit Reports | ROVEXO", robots: { index: false, follow: false } };
}
