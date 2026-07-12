import type { Metadata } from "next";
import { LegalIndexCanonical } from "@/features/legal/components/LegalIndexCanonical";
import { listLegalDocuments } from "@/lib/legal/canonical-documents";

export const metadata: Metadata = {
  title: "Legal | ROVEXO",
  description: "Canonical legal documents for the ROVEXO UK marketplace.",
  alternates: { canonical: "/legal" },
};

export default function LegalIndexPage() {
  return <LegalIndexCanonical documents={listLegalDocuments()} />;
}
