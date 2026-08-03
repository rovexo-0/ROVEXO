import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "dashboard" as const, title: "Enterprise E2E Validation Engine", description: "OMEGA validation scores, pass rates, and certification eligibility overview." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Validation Board"); }
