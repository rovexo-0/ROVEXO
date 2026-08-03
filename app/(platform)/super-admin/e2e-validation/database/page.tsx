import { renderE2eValidationPage, e2eValidationMetadata } from "@/lib/enterprise-e2e-validation-engine/page";

const props = { tab: "database" as const, title: "Database Validation", description: "Read/write operations, transactions, rollback, indexes, constraints, and migration integrity." };
export default async function Page() { return renderE2eValidationPage(props); }
export async function generateMetadata() { return e2eValidationMetadata("Database"); }
