import { CertificationCenterAdmin } from "@/features/super-admin/certification-center/CertificationCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getCertificationCenterPageData } from "@/lib/certification-center-engine/reader";

export default async function SuperAdminCertificationHistoryPage() {
  const { snapshot } = await getCertificationCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Certification History" description="Certification versions, approval timelines, and rollback availability." />
      <CertificationCenterAdmin initialSnapshot={snapshot} defaultTab="history" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Certification History | ROVEXO", robots: { index: false, follow: false } };
}
