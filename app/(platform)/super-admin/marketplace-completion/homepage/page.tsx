import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "homepage" as const, title: "Homepage", description: "Homepage completion and duplication detection." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Homepage"); }
