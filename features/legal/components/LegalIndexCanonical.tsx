"use client";

import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

import type { LegalDocument } from "@/lib/legal/types";

type LegalIndexCanonicalProps = {
  documents: LegalDocument[];
};

export function LegalIndexCanonical({ documents }: LegalIndexCanonicalProps) {
  return (
    <AccountCanonicalShell title="Legal Centre" backHref="/account" backLabel="My Account" showHeaderTitle>
      <p className="cds-section__intro">Official ROVEXO legal documents.</p>
      <CanonicalCard variant="list">
        {documents.map((document) => (
          <CanonicalMenuRow
            key={document.slug}
            href={`/legal/${document.slug}`}
            title={document.title}
            description={document.summary}
          />
        ))}
      </CanonicalCard>
    </AccountCanonicalShell>
  );
}
