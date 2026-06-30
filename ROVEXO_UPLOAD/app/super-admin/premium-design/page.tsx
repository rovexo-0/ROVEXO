import { PremiumAssetManagerPanel } from "@/features/super-admin/premium-design/PremiumAssetManagerPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getPremiumAssetInventory } from "@/lib/super-admin/premium-design/inventory";

export default async function SuperAdminPremiumDesignPage() {
  const inventory = await getPremiumAssetInventory();

  return (
    <>
      <SuperAdminPageHeader
        title="Premium Asset Manager"
        description="Manage photorealistic category icons, hero campaigns, and empty-state illustrations. Import sources, rebuild responsive exports, and validate before publish."
      />
      <PremiumAssetManagerPanel initialInventory={inventory} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Premium Asset Manager | Super Admin | ROVEXO",
    robots: { index: false, follow: false },
  };
}
