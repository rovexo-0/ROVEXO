import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "reports" as const, title: "Report Center", description: "Validation, coverage, workflow, regression, API, and certification reports with export." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Reports"); }
