import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "search" as const, title: "Development Search", description: "Search modules, files, routes, APIs, and deployments." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Development Search"); }
