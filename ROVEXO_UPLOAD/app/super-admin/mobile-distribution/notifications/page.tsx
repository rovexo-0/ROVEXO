import { MobileDistributionCenterAdmin } from "@/features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMobileDistributionCenterPageData } from "@/lib/mobile-distribution-center-engine/reader";

export default async function SuperAdminMobileDistributionNotificationsPage() {
  const { snapshot } = await getMobileDistributionCenterPageData();
  return (
    <>
      <SuperAdminPageHeader title="Mobile Notifications" description="Push alerts for updates, security and certificates." />
      <MobileDistributionCenterAdmin initialSnapshot={snapshot} defaultTab="notifications" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Mobile Notifications | ROVEXO", robots: { index: false, follow: false } };
}
