import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "categories" as const, title: "Category Validation", description: "Verify category icons, subcategories, navigation, images, descriptions, and listing counts." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Categories"); }
