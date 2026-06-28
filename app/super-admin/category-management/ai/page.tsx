import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "ai" as const, title: "AI Category Assistant", description: "OMEGA AI suggestions for parent, attributes, SEO, duplicates, merge, and split." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("AI Assistant"); }
