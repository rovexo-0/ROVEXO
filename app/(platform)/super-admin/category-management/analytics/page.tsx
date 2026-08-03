import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "analytics" as const, title: "Live Analytics", description: "Total, active, unused, duplicates, missing SEO, and certification progress." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Live Analytics"); }
