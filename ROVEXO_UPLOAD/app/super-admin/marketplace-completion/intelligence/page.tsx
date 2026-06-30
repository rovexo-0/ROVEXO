import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "intelligence" as const, title: "Marketplace Intelligence", description: "OMEGA detects missing, incomplete, legacy, duplicate and broken marketplace elements." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Marketplace Intelligence"); }
