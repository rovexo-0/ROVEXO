import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "api-studio" as const, title: "API Studio", description: "Endpoint explorer, latency, errors, and OpenAPI status." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("API Studio"); }
