import type { Metadata } from "next";
import { Suspense } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { PlatformOperatorContactSection } from "@/components/legal/PlatformOperatorContactSection";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";
import { SupportForm } from "@/features/support/components/SupportForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Support | ROVEXO",
  description: "Contact ROVEXO Support for account, order, payment, and moderation help.",
};

function SupportFormFallback() {
  return <div className="h-96 animate-pulse rounded-ds-lg bg-surface-muted" />;
}

export default function SupportPage() {
  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-6">
        <div>
          <Link href="/help" className="text-sm font-medium text-primary hover:underline">
            ← Help Centre
          </Link>
          <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">Contact Support</h1>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Submit a support request and our team will review it individually.
          </p>
        </div>
        <Suspense fallback={<SupportFormFallback />}>
          <SupportForm />
        </Suspense>
        <PlatformOperatorContactSection />
        <HelpAssistant compact />
      </main>
    </BetaAppShell>
  );
}
