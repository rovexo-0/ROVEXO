import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "ai-integration" as const, title: "AI Integration", description: "OMEGA PRIME and connected enterprise AI engines." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("AI Integration"); }
