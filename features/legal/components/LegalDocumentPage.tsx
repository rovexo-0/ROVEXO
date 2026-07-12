"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { renderMarkdown } from "@/lib/help/markdown";
import type { LegalDocument } from "@/lib/legal/types";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div className="flex flex-col gap-ds-6" data-legal-document-version="v1.0-legal-lock">
      <p className="text-sm text-text-secondary">{document.summary}</p>

      <Card padding="lg">
        <div
          className="prose-help text-sm text-text-secondary"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(document.content) }}
        />
        <p className="mt-ds-6 text-xs text-text-muted">Last updated {document.lastUpdated}</p>
      </Card>

      <p className="text-center text-sm text-text-muted">
        <Link href="/help" className="font-medium text-primary hover:opacity-80">
          Help Centre
        </Link>
        {" · "}
        <Link href="/support" className="font-medium text-primary hover:opacity-80">
          Contact Support
        </Link>
      </p>
    </div>
  );
}
