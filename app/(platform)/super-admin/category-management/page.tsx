import { renderCategoryManagementPage, categoryManagementMetadata } from "@/lib/enterprise-category-management-center/page";

const props = { tab: "dashboard" as const, title: "Enterprise Category Management Center", description: "Taxonomy board — total categories, OMEGA scores, and certification status." };
export default async function Page() { return renderCategoryManagementPage(props); }
export async function generateMetadata() { return categoryManagementMetadata("Taxonomy Board"); }
