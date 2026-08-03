import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "database-studio" as const, title: "Database Studio", description: "Schema viewer — tables, relations, indexes, and migrations." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Database Studio"); }
