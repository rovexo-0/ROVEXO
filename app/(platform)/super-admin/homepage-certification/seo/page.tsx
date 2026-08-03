import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "seo" as const, title: "SEO Validation", description: "Validate metadata, structured data, Open Graph, Twitter Cards, canonical URLs, and sitemap references." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("SEO"); }
