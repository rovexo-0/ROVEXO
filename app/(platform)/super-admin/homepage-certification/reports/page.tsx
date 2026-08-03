import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "reports" as const, title: "Certification Reports", description: "Export certification, section, performance, accessibility, SEO, and OMEGA score reports." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Reports"); }
