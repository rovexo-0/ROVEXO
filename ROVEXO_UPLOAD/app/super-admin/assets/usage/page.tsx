import { AssetManagerAdmin } from "@/features/super-admin/asset-manager/AssetManagerAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAssetManagerPageData } from "@/lib/asset-manager-engine/reader";

export default async function SuperAdminAssetsUsagePage() {
  const { snapshot } = await getAssetManagerPageData();

  return (
    <>
      <SuperAdminPageHeader title="Asset Usage Map" description="Every location where platform assets are referenced." />
      <AssetManagerAdmin initialSnapshot={snapshot} defaultTab="usage" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Asset Usage | ROVEXO", robots: { index: false, follow: false } };
}
