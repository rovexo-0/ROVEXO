import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "module-explorer" as const, title: "Module Explorer", description: "Every enterprise module with descriptor, dependencies, and health." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Module Explorer"); }
