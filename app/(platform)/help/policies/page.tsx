import type { Metadata } from "next";
import { HelpPoliciesPage } from "@/features/help/components/HelpPoliciesPage";
import { listHelpPolicies } from "@/lib/help/policies";

export const metadata: Metadata = {
  title: "Policies | ROVEXO Help Center",
  description: "Official ROVEXO marketplace policies.",
};

export default function HelpPoliciesRoute() {
  const policies = listHelpPolicies();
  return <HelpPoliciesPage policies={policies} />;
}
