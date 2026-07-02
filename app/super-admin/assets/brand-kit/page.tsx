import { AssetManagerAdmin } from "@/features/super-admin/asset-manager/AssetManagerAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAssetManagerPageData } from "@/lib/asset-manager-engine/reader";

export default async function SuperAdminAssetsBrandKitPage() {
  const { snapshot } = await getAssetManagerPageData();

  return (
    <>
      <SuperAdminPageHeader title="Brand Kit" description="Logos, colors, typography, and brand guidelines." />
      <AssetManagerAdmin initialSnapshot={snapshot} defaultTab="brand-kit" />
    </>
  );
}

export async function generateMetadata() {
  return { title: "Brand Kit | ROVEXO", robots: { index: false, follow: false } };
}
