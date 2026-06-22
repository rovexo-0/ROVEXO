import { createAdminClient } from "@/lib/supabase/admin";
import { HELP_TOPICS } from "@/lib/help/content/topics";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";
import { getAllHelpArticles } from "@/lib/help/content/articles";
import type { HelpAnalyticsEvent } from "@/lib/help/types";

export type HelpAnalyticsSummary = {
  totalEvents: number;
  topArticles: Array<{ slug: string; views: number }>;
  topTopics: Array<{ slug: string; opens: number }>;
  topTrees: Array<{ slug: string; starts: number }>;
  failedSearches: Array<{ query: string; count: number }>;
  supportTicketsGenerated: number;
  searchSuccessRate: number;
};

export async function recordHelpAnalyticsEvent(
  event: HelpAnalyticsEvent,
  userId?: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("help_analytics_events").insert({
      user_id: userId ?? null,
      event_type: event.type,
      topic_slug: event.topicSlug ?? null,
      article_slug: event.articleSlug ?? null,
      solution_id: event.solutionId ?? null,
      search_query: event.query ?? null,
      metadata: {
        path: event.path ?? [],
        ...(event.metadata ?? {}),
      },
    });
  } catch {
    // Analytics must never block help UX.
  }
}

export async function getHelpAnalyticsSummary(): Promise<HelpAnalyticsSummary & {
  contentStats: {
    topics: number;
    articles: number;
    decisionTrees: number;
  };
}> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("help_analytics_events")
    .select("event_type, topic_slug, article_slug, search_query")
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = (data ?? []) as Array<{
    event_type: string;
    topic_slug: string | null;
    article_slug: string | null;
    search_query: string | null;
  }>;

  const articleViews = new Map<string, number>();
  const topicOpens = new Map<string, number>();
  const treeStarts = new Map<string, number>();
  const failedSearches = new Map<string, number>();
  let searches = 0;
  let searchHits = 0;
  let supportTickets = 0;

  for (const row of rows) {
    if (row.event_type === "article_view" && row.article_slug) {
      articleViews.set(row.article_slug, (articleViews.get(row.article_slug) ?? 0) + 1);
    }
    if (row.event_type === "topic_open" && row.topic_slug) {
      topicOpens.set(row.topic_slug, (topicOpens.get(row.topic_slug) ?? 0) + 1);
    }
    if (row.event_type === "tree_start" && row.topic_slug) {
      treeStarts.set(row.topic_slug, (treeStarts.get(row.topic_slug) ?? 0) + 1);
    }
    if (row.event_type === "search") {
      searches += 1;
      searchHits += 1;
    }
    if (row.event_type === "search_no_results" && row.search_query) {
      searches += 1;
      failedSearches.set(row.search_query, (failedSearches.get(row.search_query) ?? 0) + 1);
    }
    if (row.event_type === "support_submit") {
      supportTickets += 1;
    }
  }

  const sortEntries = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([slug, count]) => ({ slug, views: count, opens: count, starts: count }));

  return {
    totalEvents: rows.length,
    topArticles: sortEntries(articleViews).map(({ slug, views }) => ({ slug, views })),
    topTopics: sortEntries(topicOpens).map(({ slug, opens }) => ({ slug, opens })),
    topTrees: sortEntries(treeStarts).map(({ slug, starts }) => ({ slug, starts })),
    failedSearches: [...failedSearches.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([query, count]) => ({ query, count })),
    supportTicketsGenerated: supportTickets,
    searchSuccessRate: searches ? Math.round((searchHits / searches) * 100) : 100,
    contentStats: {
      topics: HELP_TOPICS.length,
      articles: getAllHelpArticles().length,
      decisionTrees: getAllDecisionTrees().length,
    },
  };
}
