import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "components" as const, title: "Component Validation", description: "Global component validation — pages, cards, forms, dashboards." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Component Validation"); }
