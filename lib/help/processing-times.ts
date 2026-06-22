import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";

export type HelpProcessingTimeEntry = {
  id: string;
  title: string;
  processingTime: string;
  estimatedReviewTime?: string;
  estimatedTransferTime?: string;
  topicSlug: string;
  href: string;
};

export function listHelpProcessingTimes(): HelpProcessingTimeEntry[] {
  const entries: HelpProcessingTimeEntry[] = [];

  for (const tree of getAllDecisionTrees()) {
    for (const solution of Object.values(tree.solutions)) {
      if (!solution.processingTime && !solution.estimatedReviewTime && !solution.estimatedTransferTime) {
        continue;
      }
      entries.push({
        id: `${tree.topicSlug}:${solution.id}`,
        title: solution.title,
        processingTime: solution.processingTime,
        estimatedReviewTime: solution.estimatedReviewTime,
        estimatedTransferTime: solution.estimatedTransferTime,
        topicSlug: tree.topicSlug,
        href: `/help/category/${tree.topicSlug}`,
      });
    }
  }

  return entries.sort((a, b) => a.topicSlug.localeCompare(b.topicSlug));
}
