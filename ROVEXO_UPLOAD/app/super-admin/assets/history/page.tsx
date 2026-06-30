import { AssetManagerAdmin } from "@/features/super-admin/asset-manager/AssetManagerAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAssetManagerPageData } from "@/lib/asset-manager-engine/reader";

export default async function SuperAdminAssetsHistoryPage() {
  const { snapshot } = await getAssetManagerPageData();

  return (
    <>
      <SuperAdminPageHeader title="Asset History" description="Version history, rollback, and publish references." />
      <AssetManagerAdmin initialSnapshot={snapshot} defaultTab="history" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Asset History | ROVEXO", robots: { index: false, follow: false } };
}
