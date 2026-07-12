import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { HeadsetLineIcon, MailLineIcon } from "@/components/icons/RvxLineIcons";
import { PlatformOperatorContactSection } from "@/components/legal/PlatformOperatorContactSection";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";
import { SupportForm } from "@/features/support/components/SupportForm";

export const metadata: Metadata = {
  title: "Contact Support | ROVEXO",
  description: "Contact ROVEXO Support for account, order, payment, and moderation help.",
};

function SupportFormFallback() {
  return <CanonicalInfoBlock variant="description">Loading form…</CanonicalInfoBlock>;
}

export default function SupportPage() {
  return (
    <AccountCanonicalShell title="Contact Support" backHref="/help">
      <CanonicalSection
        title="Contact Support"
        intro="Submit a support request and our team will review it individually."
      >
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Email"
            description="Send us a message"
            icon={<MailLineIcon />}
            href="#support-form"
          />
          <CanonicalMenuRow
            title="Report Problem"
            description="Report an issue with an order or listing"
            icon={<HeadsetLineIcon />}
            href="/support?category=report"
          />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Support request">
        <CanonicalCard id="support-form" variant="medium">
          <Suspense fallback={<SupportFormFallback />}>
            <SupportForm />
          </Suspense>
        </CanonicalCard>
      </CanonicalSection>

      <PlatformOperatorContactSection />
      <HelpAssistant compact />
    </AccountCanonicalShell>
  );
}
