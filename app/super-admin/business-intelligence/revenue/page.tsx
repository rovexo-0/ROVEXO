import { renderBiPage, biMetadata } from "@/lib/enterprise-business-intelligence/page";

export default async function Page() {
  return renderBiPage({ tab: "revenue", title: "Revenue Analytics", description: "Financial breakdown including fees, subscriptions, and Stripe metrics." });
}

export async function generateMetadata() {
  return biMetadata("Revenue");
}
