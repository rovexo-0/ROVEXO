import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "api" as const, title: "API Validation", description: "Authentication, authorization, input/output, timeouts, rate limits, schema, and versioning." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("API Validation"); }
