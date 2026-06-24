import { HelpAdminDashboard } from "@/features/admin/components/HelpAdminDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getHelpAnalyticsSummary } from "@/lib/help/analytics";
import { listIncompleteHelpDocumentation } from "@/lib/help/feature-docs";
import { HELP_TOPICS } from "@/lib/help/content/topics";
import { getAllHelpArticles } from "@/lib/help/content/articles";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";

export default async function SuperAdminSupportPage() {
  const [analytics, incompleteDocs] = await Promise.all([
    getHelpAnalyticsSummary(),
    Promise.resolve(listIncompleteHelpDocumentation()),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Support" description="Help centre analytics and support operations." />
      <HelpAdminDashboard
        initialData={{
          analytics,
          incompleteDocs,
          topics: HELP_TOPICS.length,
          articles: getAllHelpArticles().length,
          trees: getAllDecisionTrees().length,
        }}
      />
    </>
  );
}
