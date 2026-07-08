import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "business" as const, title: "Business Rule Validation", description: "Marketplace rules, trust score, purchase protection, wallet, payments, shipping, and compliance." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Business Rules"); }
