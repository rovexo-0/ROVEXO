import { CertificationCenterAdmin } from "@/features/super-admin/certification-center/CertificationCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getCertificationCenterPageData } from "@/lib/certification-center-engine/reader";

export default async function SuperAdminCertificationReleasesPage() {
  const { snapshot } = await getCertificationCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Release Validation" description="Release checks and approval workflow before production deployment." />
      <CertificationCenterAdmin initialSnapshot={snapshot} defaultTab="releases" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Release Validation | ROVEXO", robots: { index: false, follow: false } };
}
