import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "sections" as const, title: "Section Validation", description: "Validate and certify Premium Header, Category Rail, Hero Banner, Featured Listings, and all homepage sections." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Sections"); }
