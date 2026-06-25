import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { LegalInformationSection } from "@/components/legal/LegalInformationSection";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Legal Information",
  description: "Legal information for ROVEXO operated by DNS EUROPA LTD.",
  alternates: {
    canonical: "/legal",
  },
};

export default function LegalPage() {
  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-6">
        <header>
          <h1 className="text-2xl font-bold text-text-primary">Legal Information</h1>
        </header>
        <Card padding="lg">
          <LegalInformationSection />
        </Card>
      </main>
    </BetaAppShell>
  );
}
