import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "reports" as const, title: "Category Reports", description: "Export taxonomy, validation, certification, analytics, and audit reports." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Reports"); }
