import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "coordination" as const, title: "Enterprise Coordination", description: "Sync with QA Center, Governance, Security, Certification, and Deployment modules." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Coordination"); }
