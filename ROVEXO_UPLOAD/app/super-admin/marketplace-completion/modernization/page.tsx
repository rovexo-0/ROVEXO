import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "modernization" as const, title: "Modernization Engine", description: "Identify outdated UI/UX and generate Premium 2026 modernization plans." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Modernization Engine"); }
