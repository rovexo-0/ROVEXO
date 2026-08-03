import { MobileDistributionCenterAdmin } from "@/features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMobileDistributionCenterPageData } from "@/lib/mobile-distribution-center-engine/reader";

export default async function SuperAdminMobileDistributionPage() {
  const { snapshot } = await getMobileDistributionCenterPageData();
  return (
    <>
      <SuperAdminPageHeader
        title="ROVEXO Super Admin Mobile"
        description="Enterprise Administration Application — official installation and management hub."
      />
      <MobileDistributionCenterAdmin initialSnapshot={snapshot} defaultTab="download" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Super Admin Mobile | ROVEXO", robots: { index: false, follow: false } };
}
