import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "responsive" as const, title: "Responsive Validation", description: "Verify mobile, tablet, desktop, large desktop, landscape, portrait, and safe areas." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Responsive"); }
