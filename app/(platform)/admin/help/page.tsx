import { HelpAdminDashboard } from "@/features/admin/components/HelpAdminDashboard";
import { getHelpAnalyticsSummary } from "@/lib/help/analytics";
import { listIncompleteHelpDocumentation } from "@/lib/help/feature-docs";
import { HELP_TOPICS } from "@/lib/help/content/topics";
import { getAllHelpArticles } from "@/lib/help/content/articles";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";

export default async function AdminHelpPage() {
  const [analytics, incompleteDocs] = await Promise.all([
    getHelpAnalyticsSummary(),
    Promise.resolve(listIncompleteHelpDocumentation()),
  ]);

  return (
    <HelpAdminDashboard
      initialData={{
        analytics,
        incompleteDocs,
        topics: HELP_TOPICS.length,
        articles: getAllHelpArticles().length,
        trees: getAllDecisionTrees().length,
      }}
    />
  );
}
