import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "editor" as const, title: "Category Editor", description: "Edit name, slug, SEO, icons, attributes, marketplace rules, and translations." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Category Editor"); }
