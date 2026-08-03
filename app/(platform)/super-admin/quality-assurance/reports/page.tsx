import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "reports" as const, title: "QA Reports", description: "Export validation runs, certification status, and audit summaries." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Reports"); }
