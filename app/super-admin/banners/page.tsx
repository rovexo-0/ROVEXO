import { BannerManagerPanel } from "@/features/super-admin/mission-control/BannerManagerPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMissionControlSnapshot } from "@/lib/super-admin/mission-control/snapshot";

export default async function SuperAdminBannersPage() {
  const snapshot = await getMissionControlSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Banner Manager"
        description="Schedule, crop, and publish hero slider campaigns with responsive preview."
      />
      <BannerManagerPanel initialConfig={snapshot.banners} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Banner Manager | Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
