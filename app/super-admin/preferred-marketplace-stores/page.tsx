import { PreferredMarketplaceStoresPanel } from "@/features/super-admin/components/PreferredMarketplaceStoresPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function PreferredMarketplaceStoresPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Preferred Marketplace Stores"
        description="Configure normal sellers with homepage ranking slot privileges. No special buyer-facing badges."
      />
      <PreferredMarketplaceStoresPanel />
    </>
  );
}
