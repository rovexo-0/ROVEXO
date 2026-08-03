import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "failures" as const, title: "Failure Analysis", description: "Root cause, severity, recommended fix, dependencies, and certification impact for every failure." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Failure Analysis"); }
