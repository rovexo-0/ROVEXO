"use client";

import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalMenuRow } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

import type { LegalDocument } from "@/lib/legal/types";

type LegalIndexCanonicalProps = {
  documents: LegalDocument[];
};

export function LegalIndexCanonical({ documents }: LegalIndexCanonicalProps) {
  return (
    <AccountCanonicalShell title="Legal Centre" backHref="/account" backLabel="My Account" showHeaderTitle>
      <div className="fw-engine__stack" data-full-width-surface="legal-information">
        <p className="cds-section__intro">Official ROVEXO legal documents.</p>
        <div className="fw-engine__group">
          {documents.map((document) => (
            <CanonicalMenuRow
              key={document.slug}
              href={`/legal/${document.slug}`}
              title={document.title}
              description={document.summary}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="help" />
                </span>
              }
            />
          ))}
        </div>
      </div>
    </AccountCanonicalShell>
  );
}
