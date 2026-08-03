import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "release-pipeline" as const, title: "Release Pipeline", description: "Governance to production approval stages." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("Release Pipeline"); }
