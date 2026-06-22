import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { getHelpAnalyticsSummary } from "@/lib/help/analytics";
import { listIncompleteHelpDocumentation } from "@/lib/help/feature-docs";
import { HELP_TOPICS } from "@/lib/help/content/topics";
import { getAllHelpArticles } from "@/lib/help/content/articles";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const [analytics, incompleteDocs] = await Promise.all([
    getHelpAnalyticsSummary(),
    Promise.resolve(listIncompleteHelpDocumentation()),
  ]);

  return NextResponse.json({
    analytics,
    incompleteDocs,
    topics: HELP_TOPICS.length,
    articles: getAllHelpArticles().length,
    trees: getAllDecisionTrees().length,
  });
}
