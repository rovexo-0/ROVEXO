import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DecisionTreeWizard } from "@/features/help/components/DecisionTreeWizard";
import { HelpCategoryHubPage } from "@/features/help/components/HelpCategoryHubPage";
import {
  getHelpCategoryHub,
  isHelpCategoryHubSlug,
} from "@/lib/help/content/category-hubs-v1";
import { getHelpTopic } from "@/lib/help/content/topics";
import { getDecisionTree } from "@/lib/help/decision-trees/registry";

type HelpCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: HelpCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hub = getHelpCategoryHub(slug);
  if (hub) {
    return {
      title: `${hub.title} | ROVEXO Help Centre`,
      description: hub.summary,
    };
  }
  const topic = getHelpTopic(slug);
  if (!topic) return { title: "Help topic not found" };
  return {
    title: `${topic.label} Help | ROVEXO Help Center`,
    description: topic.description,
  };
}

export default async function HelpCategoryPage({ params }: HelpCategoryPageProps) {
  const { slug } = await params;

  if (isHelpCategoryHubSlug(slug)) {
    const hub = getHelpCategoryHub(slug);
    if (!hub) notFound();
    return <HelpCategoryHubPage hub={hub} />;
  }

  const topic = getHelpTopic(slug);
  const tree = getDecisionTree(slug as Parameters<typeof getDecisionTree>[0]);

  if (!topic || !tree) {
    notFound();
  }

  return <DecisionTreeWizard tree={tree} />;
}
