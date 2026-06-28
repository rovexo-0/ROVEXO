import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "super-admin" as const, title: "Super Admin Validation", description: "Validate every enterprise module including OMEGA, QA, Governance, Security, and Deployment." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Super Admin"); }
