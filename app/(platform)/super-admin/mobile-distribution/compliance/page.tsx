import { MobileDistributionCenterAdmin } from "@/features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMobileDistributionCenterPageData } from "@/lib/mobile-distribution-center-engine/reader";

export default async function SuperAdminMobileDistributionCompliancePage() {
  const { snapshot } = await getMobileDistributionCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Mobile Compliance" description="ROVEXO TRUST and enterprise compliance readiness." />
      <MobileDistributionCenterAdmin initialSnapshot={snapshot} defaultTab="compliance" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Mobile Compliance | ROVEXO", robots: { index: false, follow: false } };
}
