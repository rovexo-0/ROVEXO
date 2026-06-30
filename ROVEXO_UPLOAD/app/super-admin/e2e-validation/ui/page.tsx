import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "ui" as const, title: "Full UI Validation", description: "Validate every button, menu, modal, dropdown, filter, and control across the platform." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("UI Validation"); }
