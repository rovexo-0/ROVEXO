import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "project-explorer" as const, title: "Project Explorer", description: "Tree view of modules, packages, apps, and enterprise assets." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Project Explorer"); }
