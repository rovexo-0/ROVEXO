"use client";

import { CanonicalButtonLink, CanonicalInfoBlock } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { SUPPORT_SUCCESS_MESSAGE } from "@/lib/support/types";

type SupportSuccessPageProps = {
  ticketNumber?: string;
};

export function SupportSuccessPage({ ticketNumber }: SupportSuccessPageProps) {
  return (
    <AccountCanonicalShell title="Support request sent" backHref="/help" backLabel="Help Centre">
      <CanonicalInfoBlock variant="success">
        <p className="font-medium">{SUPPORT_SUCCESS_MESSAGE.title}</p>
        {ticketNumber ? <p className="mt-ds-2">Reference: {ticketNumber}</p> : null}
        <div className="mt-ds-4 space-y-ds-2">
          {SUPPORT_SUCCESS_MESSAGE.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </CanonicalInfoBlock>
      <CanonicalButtonLink href="/help" variant="secondary" className="mt-ds-4">
        Back to Help Centre
      </CanonicalButtonLink>
    </AccountCanonicalShell>
  );
}
