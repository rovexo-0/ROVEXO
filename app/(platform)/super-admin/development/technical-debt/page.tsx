import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "technical-debt" as const, title: "Technical Debt", description: "Architecture, security, UI, performance, and enterprise debt." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Technical Debt"); }
