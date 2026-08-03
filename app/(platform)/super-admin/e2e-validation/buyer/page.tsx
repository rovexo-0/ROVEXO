import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "buyer" as const, title: "Buyer Flow Validation", description: "End-to-end validation from register through checkout, orders, and logout." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Buyer Flows"); }
