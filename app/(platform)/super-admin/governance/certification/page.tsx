import { renderGovernancePage, governanceMetadata } from "@/lib/enterprise-governance-center/page";

const props = { tab: "certification" as const, title: "Certification Center", description: "Release certification and digitally signed enterprise certificates." };
export default async function Page() { return renderGovernancePage(props); }
export async function generateMetadata() { return governanceMetadata("Certification"); }
