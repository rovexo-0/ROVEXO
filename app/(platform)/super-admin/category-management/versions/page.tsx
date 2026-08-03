import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "versions" as const, title: "Version Control", description: "Full history, version compare, restore, rollback, and immutable audit timeline." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Version Control"); }
