import { AssetManagerAdmin } from "@/features/super-admin/asset-manager/AssetManagerAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAssetManagerPageData } from "@/lib/asset-manager-engine/reader";

export default async function SuperAdminAssetsStoragePage() {
  const { snapshot } = await getAssetManagerPageData();

  return (
    <>
      <SuperAdminPageHeader title="Storage Center" description="Storage usage, optimization savings, and validation." />
      <AssetManagerAdmin initialSnapshot={snapshot} defaultTab="storage" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Asset Storage | ROVEXO", robots: { index: false, follow: false } };
}
