import { MarketplaceIntelligenceAdmin } from "@/features/super-admin/marketplace-intelligence/MarketplaceIntelligenceAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { buildMarketplaceIntelligenceDashboard } from "@/lib/marketplace-intelligence/dashboard";
import { getMarketplaceIntelligenceDraft } from "@/lib/marketplace-intelligence/engine";

export default async function SuperAdminMarketplaceIntelligencePage() {
  const [snapshot, draftDocument] = await Promise.all([
    buildMarketplaceIntelligenceDashboard(),
    getMarketplaceIntelligenceDraft(),
  ]);

  return (
    <>
      <SuperAdminPageHeader
        title="Marketplace Intelligence Platform"
        description="Enterprise marketplace automation — health, quality, ranking, and opportunities. Deterministic rules only."
      />
      <MarketplaceIntelligenceAdmin initialSnapshot={snapshot} draftDocument={draftDocument} />
    </>
  );
}
