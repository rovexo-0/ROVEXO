import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "architecture-studio" as const, title: "Architecture Studio", description: "Interactive module, API, and dependency relationships." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Architecture Studio"); }
