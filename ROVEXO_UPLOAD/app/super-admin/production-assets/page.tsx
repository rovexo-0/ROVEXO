import { ProductionAssetValidatorPanel } from "@/features/super-admin/production-assets/ProductionAssetValidatorPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { validateProductionAssets } from "@/lib/super-admin/production-assets/validator";

export default async function SuperAdminProductionAssetsPage() {
  const report = await validateProductionAssets();

  return (
    <>
      <SuperAdminPageHeader
        title="Production Asset Validator"
        description="Verify homepage, category, and hero assets before deployment. Placeholder or demo graphics block production builds."
      />
      <ProductionAssetValidatorPanel initialReport={report} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Production Asset Validator | Super Admin | ROVEXO",
    robots: { index: false, follow: false },
  };
}
