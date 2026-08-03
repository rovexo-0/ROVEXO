import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "tree" as const, title: "Enterprise Category Tree", description: "Three-panel workspace — tree, category workspace, and enterprise inspector." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Category Tree"); }
