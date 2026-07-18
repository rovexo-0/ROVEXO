import { listLegalDocuments } from "@/lib/legal/canonical-documents";

export type HelpPolicyEntry = {
  slug: string;
  title: string;
  summary: string;
  href: string;
  category: string;
};

/** Help Policies list — Legal SSOT only (England & Wales marketplace docs). */
export function listHelpPolicies(): HelpPolicyEntry[] {
  return listLegalDocuments().map((document) => ({
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    href: `/legal/${document.slug}`,
    category: document.category,
  }));
}
