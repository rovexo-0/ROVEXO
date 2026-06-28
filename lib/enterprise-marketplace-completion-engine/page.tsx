import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseMarketplaceCompletionAdmin } from "@/features/super-admin/enterprise-marketplace-completion-engine/EnterpriseMarketplaceCompletionAdmin";
import { getMarketplaceCompletionPageData } from "@/lib/enterprise-marketplace-completion-engine/reader";
import type { MarketplaceCompletionTab } from "@/lib/enterprise-marketplace-completion-engine/types";

type MarketplaceCompletionPageProps = { tab: MarketplaceCompletionTab; title: string; description: string };

export async function renderMarketplaceCompletionPage({ tab, title, description }: MarketplaceCompletionPageProps) {
  const { snapshot } = await getMarketplaceCompletionPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseMarketplaceCompletionAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function marketplaceCompletionMetadata(title: string) {
  return { title: `${title} · Marketplace Completion` };
}
