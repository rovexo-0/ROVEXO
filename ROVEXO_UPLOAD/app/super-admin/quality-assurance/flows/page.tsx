import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "flows" as const, title: "User Flow Validation", description: "Automated buyer, seller, business, and super admin workflow regression." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Flows"); }
