import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "dependency-graph" as const, title: "Dependency Graph", description: "Live dependency graph with cycles and broken links." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Dependency Graph"); }
