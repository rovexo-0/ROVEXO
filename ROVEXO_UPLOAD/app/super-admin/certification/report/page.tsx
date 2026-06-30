import { CertificationCenterAdmin } from "@/features/super-admin/certification-center/CertificationCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getCertificationCenterPageData } from "@/lib/certification-center-engine/reader";

export default async function SuperAdminCertificationReportPage() {
  const { snapshot } = await getCertificationCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Certification Reports" description="Executive, technical, security, and production certification reports." />
      <CertificationCenterAdmin initialSnapshot={snapshot} defaultTab="report" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Certification Reports | ROVEXO", robots: { index: false, follow: false } };
}
