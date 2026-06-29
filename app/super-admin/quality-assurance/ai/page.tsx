import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "ai" as const, title: "AI Validation", description: "Listing quality, compliance, duplicate detection, and marketplace rule validation." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("AI"); }
