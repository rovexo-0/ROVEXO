import type { Metadata } from "next";
import { HelpPoliciesPage } from "@/features/help/components/HelpPoliciesPage";
import { resolveViewerHelpAudiences } from "@/lib/help/help-content-audience-server-v1";
import { listHelpPolicies } from "@/lib/help/policies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policies | ROVEXO Help Center",
  description: "Official ROVEXO marketplace policies.",
};

export default async function HelpPoliciesRoute() {
  const allowedAudiences = await resolveViewerHelpAudiences();
  const policies = listHelpPolicies(allowedAudiences);
  return <HelpPoliciesPage policies={policies} />;
}
