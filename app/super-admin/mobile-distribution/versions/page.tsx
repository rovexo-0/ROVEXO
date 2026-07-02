import { MobileDistributionCenterAdmin } from "@/features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMobileDistributionCenterPageData } from "@/lib/mobile-distribution-center-engine/reader";

export default async function SuperAdminMobileDistributionVersionsPage() {
  const { snapshot } = await getMobileDistributionCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Version Center" description="Super Admin Mobile release management." />
      <MobileDistributionCenterAdmin initialSnapshot={snapshot} defaultTab="versions" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Mobile Versions | ROVEXO", robots: { index: false, follow: false } };
}
