import { renderHomepageCertificationPage, homepageCertificationMetadata } from "@/lib/homepage-enterprise-certification-engine/page";

const props = { tab: "dashboard" as const, title: "Homepage Enterprise Certification", description: "OMEGA certification scores, overall PASS %, and production certification status." };
export default async function Page() { return renderHomepageCertificationPage(props); }
export async function generateMetadata() { return homepageCertificationMetadata("Certification Board"); }
