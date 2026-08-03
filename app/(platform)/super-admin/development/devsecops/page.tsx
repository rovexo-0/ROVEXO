import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

const props = { tab: "devsecops" as const, title: "DevSecOps", description: "Build, test, validate, deploy, and rollback pipeline." };
export default async function Page() { return renderDevelopmentPage(props); }
export async function generateMetadata() { return developmentMetadata("DevSecOps"); }
