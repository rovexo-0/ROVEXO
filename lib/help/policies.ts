import { listLegalDocuments } from "@/lib/legal/canonical-documents";
import {
  canAccessHelpContent,
  HELP_AUDIENCES_FOR_GUEST,
  type HelpContentAudience,
} from "@/lib/help/help-content-audience-v1";

export type HelpPolicyEntry = {
  slug: string;
  title: string;
  summary: string;
  href: string;
  category: string;
};

/** Help Policies list — Legal SSOT only (England & Wales marketplace docs). */
export function listHelpPolicies(
  allowedAudiences: readonly HelpContentAudience[] = HELP_AUDIENCES_FOR_GUEST,
): HelpPolicyEntry[] {
  return listLegalDocuments()
    .filter((document) => canAccessHelpContent(document.audience, allowedAudiences))
    .map((document) => ({
      slug: document.slug,
      title: document.title,
      summary: document.summary,
      href: `/legal/${document.slug}`,
      category: document.category,
    }));
}
