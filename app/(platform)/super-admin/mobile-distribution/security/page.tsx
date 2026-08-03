import { MobileDistributionCenterAdmin } from "@/features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMobileDistributionCenterPageData } from "@/lib/mobile-distribution-center-engine/reader";

export default async function SuperAdminMobileDistributionSecurityPage() {
  const { snapshot } = await getMobileDistributionCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Mobile Security" description="Biometric login and enterprise security readiness." />
      <MobileDistributionCenterAdmin initialSnapshot={snapshot} defaultTab="security" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Mobile Security | ROVEXO", robots: { index: false, follow: false } };
}
