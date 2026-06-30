import { CertificationCenterAdmin } from "@/features/super-admin/certification-center/CertificationCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getCertificationCenterPageData } from "@/lib/certification-center-engine/reader";

export default async function SuperAdminCertificationSettingsPage() {
  const { snapshot } = await getCertificationCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Certification Settings" description="Scheduled validation and continuous readiness monitoring." />
      <CertificationCenterAdmin initialSnapshot={snapshot} defaultTab="settings" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Certification Settings | ROVEXO", robots: { index: false, follow: false } };
}
