import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentCanonical } from "@/features/legal/components/LegalDocumentCanonical";
import { getLegalDocument, getLegalDocumentForAudience } from "@/lib/legal/canonical-documents";
import { resolveViewerHelpAudiences } from "@/lib/help/help-content-audience-server-v1";

type LegalDocumentRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LegalDocumentRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) {
    return { title: "Legal | ROVEXO" };
  }
  if ((document.audience ?? "shared") !== "shared") {
    const allowedAudiences = await resolveViewerHelpAudiences();
    if (!getLegalDocumentForAudience(slug, allowedAudiences)) {
      return { title: "Legal | ROVEXO", robots: { index: false, follow: true } };
    }
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
  if ((document.audience ?? "shared") !== "shared") {
    const allowedAudiences = await resolveViewerHelpAudiences();
    if (!getLegalDocumentForAudience(slug, allowedAudiences)) {
      notFound();
    }
  }

  return <LegalDocumentCanonical document={document} />;
}
