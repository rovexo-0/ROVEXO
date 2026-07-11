import type { Metadata } from "next";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { listLegalDocuments } from "@/lib/legal/canonical-documents";
import { LEGAL_OPERATOR_NAME } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Legal | ROVEXO",
  description: "Canonical legal documents for the ROVEXO UK marketplace.",
  alternates: { canonical: "/legal" },
};

export default function LegalIndexPage() {
  const documents = listLegalDocuments();

  return (
    <BetaAppShell showBottomNav={false}>
      <main
        className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-6"
        data-legal-index-version="v1.0-legal-lock"
      >
        <header>
          <h1 className="text-2xl font-bold text-text-primary">Legal</h1>
          <p className="mt-ds-2 text-sm text-text-secondary">
            {LEGAL_OPERATOR_NAME} operates ROVEXO. These documents describe how the implemented platform works.
          </p>
        </header>

        <Card padding="md">
          <ul className="divide-y divide-border">
            {documents.map((document) => (
              <li key={document.slug}>
                <Link
                  href={`/legal/${document.slug}`}
                  className="flex flex-col gap-ds-1 py-ds-4 text-left hover:opacity-80"
                >
                  <span className="font-medium text-text-primary">{document.title}</span>
                  <span className="text-sm text-text-secondary">{document.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </BetaAppShell>
  );
}
