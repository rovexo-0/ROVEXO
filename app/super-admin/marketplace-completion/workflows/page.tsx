import { renderMarketplaceCompletionPage, marketplaceCompletionMetadata } from "@/lib/enterprise-marketplace-completion-engine/page";

const props = { tab: "workflows" as const, title: "Workflow Validation", description: "Global workflow validation — buyer, seller, company, business and super-admin journeys." };
export default async function Page() { return renderMarketplaceCompletionPage(props); }
export async function generateMetadata() { return marketplaceCompletionMetadata("Workflow Validation"); }
