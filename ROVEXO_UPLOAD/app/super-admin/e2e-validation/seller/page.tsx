import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "seller" as const, title: "Seller Flow Validation", description: "Registration through listing creation, AI validation, publish, orders, and payouts." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Seller Flows"); }
