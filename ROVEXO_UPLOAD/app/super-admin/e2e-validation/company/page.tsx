import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "company" as const, title: "Company Flow Validation", description: "Company registration, employees, roles, branches, invoices, and verification." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Company Flows"); }
