import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HelpCentrePage } from "@/features/help/components/HelpCentrePage";

export const metadata: Metadata = {
  title: "Help Center | ROVEXO",
  description: "Interactive ROVEXO Help Center with guided troubleshooting for buyers, sellers, and businesses.",
};

type HelpIndexPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HelpIndexPage({ searchParams }: HelpIndexPageProps) {
  const params = await searchParams;

  return (
    <BetaAppShell showBottomNav={false}>
      <HelpCentrePage initialQuery={params.q ?? ""} />
    </BetaAppShell>
  );
}
