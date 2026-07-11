"use client";

import Link from "next/link";
import { PageBack } from "@/components/navigation/PageBack";
import { Card } from "@/components/ui/Card";
import { renderMarkdown } from "@/lib/help/markdown";
import type { LegalDocument } from "@/lib/legal/types";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-ds-6 px-ds-4 py-ds-6"
      data-legal-document-version="v1.0-legal-lock"
    >
      <div>
        <PageBack variant="text" backHref="/legal" backLabel="Legal" className="mb-ds-2" />
        <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">{document.title}</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">{document.summary}</p>
      </div>

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
