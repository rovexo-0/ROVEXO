import { renderDevDirectorPage, devDirectorMetadata } from "@/lib/omega-development-director/page";

const props = { tab: "roadmap" as const, title: "Project Roadmap", description: "Priority-organized development work with dependencies, risk, and impact scores." };
export default async function Page() { return renderDevDirectorPage(props); }
export async function generateMetadata() { return devDirectorMetadata("Roadmap"); }
