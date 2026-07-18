"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import type { LegalDocument } from "@/lib/legal/types";

type LegalDocumentCanonicalProps = {
  document: LegalDocument;
};

export function LegalDocumentCanonical({ document }: LegalDocumentCanonicalProps) {
  return (
    <AccountCanonicalShell title={document.title} backHref="/legal" backLabel="Legal" showHeaderTitle>
      <LegalDocumentPage document={document} />
    </AccountCanonicalShell>
  );
}
