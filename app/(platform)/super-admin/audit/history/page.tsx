import { AuditComplianceCenterAdmin } from "@/features/super-admin/audit-compliance/AuditComplianceCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAuditCompliancePageData } from "@/lib/audit-compliance-engine/reader";

export default async function SuperAdminAuditHistoryPage() {
  const { snapshot } = await getAuditCompliancePageData();
  return (
    <>
      <SuperAdminPageHeader title="Audit History" description="Enterprise audit runs, certification status, and risk scores." />
      <AuditComplianceCenterAdmin initialSnapshot={snapshot} defaultTab="history" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Audit History | ROVEXO", robots: { index: false, follow: false } };
}
