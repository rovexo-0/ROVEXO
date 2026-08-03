import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentCanonical } from "@/features/legal/components/LegalDocumentCanonical";
import { getLegalDocument } from "@/lib/legal/canonical-documents";

type LegalDocumentRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LegalDocumentRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) {
    return { title: "Legal | ROVEXO" };
  }

  return {
    title: `${document.title} | ROVEXO`,
    description: document.summary,
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalDocumentRoute({ params }: LegalDocumentRouteProps) {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) {
    notFound();
  }

  return <LegalDocumentCanonical document={document} />;
}
