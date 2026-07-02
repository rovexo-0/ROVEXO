import { renderQaPage, qaMetadata } from "@/lib/omega-quality-assurance-center/page";

const props = { tab: "platform" as const, title: "Platform Validation", description: "Continuous validation across buyer, seller, company, super admin, and infrastructure domains." };
export default async function Page() { return renderQaPage(props); }
export async function generateMetadata() { return qaMetadata("Platform"); }
