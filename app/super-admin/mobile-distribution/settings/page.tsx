import { MobileDistributionCenterAdmin } from "@/features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMobileDistributionCenterPageData } from "@/lib/mobile-distribution-center-engine/reader";

export default async function SuperAdminMobileDistributionSettingsPage() {
  const { snapshot } = await getMobileDistributionCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="OMEGA & ORI" description="OMEGA monitoring and ORI insights for Super Admin Mobile." />
      <MobileDistributionCenterAdmin initialSnapshot={snapshot} defaultTab="omega" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Mobile OMEGA | ROVEXO", robots: { index: false, follow: false } };
}
