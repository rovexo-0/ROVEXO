import { CertificationCenterAdmin } from "@/features/super-admin/certification-center/CertificationCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getCertificationCenterPageData } from "@/lib/certification-center-engine/reader";

export default async function SuperAdminCertificationPage() {
  const { snapshot } = await getCertificationCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Certification Center" description="Production release gate and enterprise certification platform." />
      <CertificationCenterAdmin initialSnapshot={snapshot} defaultTab="dashboard" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Certification Center | ROVEXO", robots: { index: false, follow: false } };
}
