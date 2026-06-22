import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HelpPoliciesPage } from "@/features/help/components/HelpPoliciesPage";
import { listHelpPolicies } from "@/lib/help/policies";

export const metadata: Metadata = {
  title: "Policies | ROVEXO Help Center",
  description: "Platform rules, terms, privacy, safety, and community guidelines.",
};

export default function HelpPoliciesRoute() {
  return (
    <BetaAppShell showBottomNav={false}>
      <HelpPoliciesPage policies={listHelpPolicies()} />
    </BetaAppShell>
  );
}
