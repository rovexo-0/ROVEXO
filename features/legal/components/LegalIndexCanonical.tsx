"use client";

import { CanonicalCard } from "@/src/components/canonical";
import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { LEGAL_OPERATOR_NAME } from "@/lib/legal/content";
import type { LegalDocument } from "@/lib/legal/types";

type LegalIndexCanonicalProps = {
  documents: LegalDocument[];
};

export function LegalIndexCanonical({ documents }: LegalIndexCanonicalProps) {
  return (
    <AccountCanonicalShell title="Legal" backHref="/account/settings" showHeaderTitle>
      <p className="cds-section__intro">
        {LEGAL_OPERATOR_NAME} operates ROVEXO. These documents describe how the implemented platform works.
      </p>
      <CanonicalCard variant="list">
        {documents.map((document) => (
          <Link
            key={document.slug}
            href={`/legal/${document.slug}`}
            className="cds-menu-row flex flex-col gap-ds-1 px-ds-4 py-ds-4 text-left"
          >
            <span className="cds-menu-row__title">{document.title}</span>
            <span className="cds-menu-row__subtitle">{document.summary}</span>
          </Link>
        ))}
      </CanonicalCard>
    </AccountCanonicalShell>
  );
}
