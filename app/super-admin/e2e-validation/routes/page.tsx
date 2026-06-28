import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "routes" as const, title: "Route Validation", description: "Verify redirects, protected routes, permissions, 404/403 handling, and navigation." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Route Validation"); }
