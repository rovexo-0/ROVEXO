import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "users", title: "User Analytics", description: "Registrations, retention, churn, and trust scores." });
}

export async function generateMetadata() {
  return biMetadata("Users");
}
