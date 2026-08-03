import { AuditComplianceCenterAdmin } from "@/features/super-admin/audit-compliance/AuditComplianceCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAuditCompliancePageData } from "@/lib/audit-compliance-engine/reader";

export default async function SuperAdminAuditCertificationPage() {
  const { snapshot } = await getAuditCompliancePageData();
  return (
    <>
      <SuperAdminPageHeader title="Enterprise Certification" description="Final verification layer before production deployment." />
      <AuditComplianceCenterAdmin initialSnapshot={snapshot} defaultTab="certification" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Enterprise Certification | ROVEXO", robots: { index: false, follow: false } };
}
