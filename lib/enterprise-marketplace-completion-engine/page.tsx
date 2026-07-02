import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseMarketplaceCompletionAdmin } from "@/features/super-admin/enterprise-marketplace-completion-engine/EnterpriseMarketplaceCompletionAdmin";
import { createMarketplaceCompletionShellSnapshot } from "@/lib/enterprise-marketplace-completion-engine/pending-state";
import type { MarketplaceCompletionTab } from "@/lib/enterprise-marketplace-completion-engine/types";

type MarketplaceCompletionPageProps = { tab: MarketplaceCompletionTab; title: string; description: string };

export function renderMarketplaceCompletionPage({ tab, title, description }: MarketplaceCompletionPageProps) {
  const snapshot = createMarketplaceCompletionShellSnapshot(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseMarketplaceCompletionAdmin initialSnapshot={snapshot} defaultTab={tab} loadSnapshotOnMount />
    </>
  );
}

export function marketplaceCompletionMetadata(title: string) {
  return { title: `${title} · Marketplace Completion` };
}
