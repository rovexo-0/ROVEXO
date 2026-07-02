import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "certification" as const, title: "Certification Pipeline", description: "Development through production certified — nothing ships without OMEGA PASS." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Certification"); }
