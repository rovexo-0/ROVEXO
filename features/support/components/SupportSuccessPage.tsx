"use client";

import { CanonicalButtonLink, CanonicalCard, CanonicalSection } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

type SupportSuccessPageProps = {
  ticketNumber?: string;
};

export function SupportSuccessPage({ ticketNumber }: SupportSuccessPageProps) {
  return (
    <AccountCanonicalShell title="Request sent" backHref="/help" backLabel="Help Centre">
      <CanonicalSection title="Sent">
        <CanonicalCard variant="success" className="flex w-full flex-col gap-ds-2 p-ds-4">
          <p className="text-sm font-medium text-text-primary">We received your request.</p>
          {ticketNumber ? (
            <p className="text-sm text-text-secondary">Reference: {ticketNumber}</p>
          ) : null}
          <p className="text-sm text-text-secondary">We will reply by email.</p>
        </CanonicalCard>
      </CanonicalSection>
      <CanonicalButtonLink href="/help" variant="secondary" fullWidth>
        Back to Help Centre
      </CanonicalButtonLink>
    </AccountCanonicalShell>
  );
}
