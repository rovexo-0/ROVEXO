import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "cleanup" as const, title: "Cleanup Engine", description: "Detect unused assets, legacy files and generate safe cleanup proposals." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Cleanup Engine"); }
