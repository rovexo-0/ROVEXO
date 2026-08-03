import { MobileDistributionCenterAdmin } from "@/features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMobileDistributionCenterPageData } from "@/lib/mobile-distribution-center-engine/reader";

export default async function SuperAdminMobileDistributionAnalyticsPage() {
  const { snapshot } = await getMobileDistributionCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Download Analytics" description="Super Admin Mobile distribution metrics." />
      <MobileDistributionCenterAdmin initialSnapshot={snapshot} defaultTab="analytics" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Mobile Analytics | ROVEXO", robots: { index: false, follow: false } };
}
