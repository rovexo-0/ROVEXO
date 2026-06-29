import { AssetManagerAdmin } from "@/features/super-admin/asset-manager/AssetManagerAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAssetManagerPageData } from "@/lib/asset-manager-engine/reader";

export default async function SuperAdminAssetsPage() {
  const { snapshot } = await getAssetManagerPageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Asset Manager"
        description="Digital Asset Operating System — centralized management for every platform asset."
      />
      <AssetManagerAdmin initialSnapshot={snapshot} defaultTab="overview" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Asset Manager | ROVEXO",
    robots: { index: false, follow: false },
  };
}
