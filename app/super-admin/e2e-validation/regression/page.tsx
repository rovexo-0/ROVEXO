import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "regression" as const, title: "Automatic Regression Testing", description: "Targeted regression, integration tests, UI and workflow validation on change detection." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Regression"); }
