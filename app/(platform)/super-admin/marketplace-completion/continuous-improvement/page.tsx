import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "continuous-improvement" as const, title: "Continuous Improvement", description: "OMEGA never stops — auto-scan after every commit, merge, PR, deployment and change." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Continuous Improvement"); }
