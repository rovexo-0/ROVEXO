import { AssetManagerAdmin } from "@/features/super-admin/asset-manager/AssetManagerAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAssetManagerPageData } from "@/lib/asset-manager-engine/reader";

export default async function SuperAdminAssetsLibraryPage() {
  const { snapshot } = await getAssetManagerPageData();

  return (
    <>
      <SuperAdminPageHeader title="Asset Library" description="Browse, search, and manage enterprise asset libraries." />
      <AssetManagerAdmin initialSnapshot={snapshot} defaultTab="library" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Asset Library | ROVEXO", robots: { index: false, follow: false } };
}
