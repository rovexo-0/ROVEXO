import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "health-scores" as const, title: "Enterprise Health Scores", description: "Live health scores for marketplace, infrastructure, security and overall platform." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Enterprise Health Scores"); }
