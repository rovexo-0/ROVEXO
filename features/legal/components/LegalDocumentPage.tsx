"use client";

import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { renderMarkdown } from "@/lib/help/markdown";
import type { LegalDocument } from "@/lib/legal/types";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div className="flex flex-col gap-[var(--cds-space-section-gap,24px)]" data-legal-document-version="v1.0-legal-lock">
      <p className="cds-menu-row__subtitle">{document.summary}</p>

      <CanonicalCard variant="medium">
        <div className="p-ds-4">
          <div
            className="prose-help cds-menu-row__subtitle"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(document.content) }}
          />
          <p className="cds-field__hint mt-ds-4">Updated {document.lastUpdated}</p>
        </div>
      </CanonicalCard>

      <CanonicalCard variant="list">
        <CanonicalMenuRow title="Help Centre" href="/help" />
        <CanonicalMenuRow title="Contact Support" href="/support" />
      </CanonicalCard>
    </div>
  );
}
