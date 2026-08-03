import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "modules" as const, title: "Module QA Status", description: "Per-module validation status and certification eligibility." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Modules"); }
