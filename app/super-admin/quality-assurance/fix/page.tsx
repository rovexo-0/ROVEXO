import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "fix" as const, title: "Autonomous Fix Engine", description: "Analyze, fix, validate, regression test, and deploy safe candidates." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Fix Engine"); }
