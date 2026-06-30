import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "pipeline" as const, title: "Quality Pipeline", description: "Every recommendation flows through QA, Security, Governance, Certification, and Deployment." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Quality Pipeline"); }
