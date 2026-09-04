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
import { canAccessHelpContent, isLegacyHelpTopicSlug } from "@/lib/help/help-content-audience-v1";
import { resolveViewerHelpAudiences } from "@/lib/help/help-content-audience-server-v1";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type HelpCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

const HIDDEN_HELP_METADATA: Metadata = buildPageMetadata({
  title: "Help | ROVEXO",
  description: "ROVEXO Help Centre.",
  path: "/help",
  noIndex: true,
  omitCanonical: true,
});

export async function generateMetadata({ params }: HelpCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isLegacyHelpTopicSlug(slug) && !isHelpCategoryHubSlug(slug)) {
    return HIDDEN_HELP_METADATA;
  }

  const allowedAudiences = await resolveViewerHelpAudiences();
  const hub = getHelpCategoryHub(slug);
  if (hub) {
    if (!canAccessHelpContent(hub.audience, allowedAudiences)) {
      return HIDDEN_HELP_METADATA;
    }
    return {
      title: `${hub.title} | ROVEXO Help Centre`,
      description: hub.summary,
    };
  }
  const topic = getHelpTopic(slug);
  if (!topic || !canAccessHelpContent(topic.audience, allowedAudiences)) {
    return HIDDEN_HELP_METADATA;
  }
  return {
    title: `${topic.label} Help | ROVEXO Help Center`,
    description: topic.description,
  };
}

export default async function HelpCategoryPage({ params }: HelpCategoryPageProps) {
  const { slug } = await params;
  const allowedAudiences = await resolveViewerHelpAudiences();

  if (isHelpCategoryHubSlug(slug)) {
    const hub = getHelpCategoryHub(slug);
    if (!hub || !canAccessHelpContent(hub.audience, allowedAudiences)) {
      notFound();
    }
    return <HelpCategoryHubPage hub={hub} allowedAudiences={allowedAudiences} />;
  }

  if (isLegacyHelpTopicSlug(slug)) {
    notFound();
  }

  const topic = getHelpTopic(slug);
  const tree = getDecisionTree(slug as Parameters<typeof getDecisionTree>[0]);

  if (!topic || !tree) {
    notFound();
  }
  if (!canAccessHelpContent(topic.audience, allowedAudiences)) {
    notFound();
  }
  if (!canAccessHelpContent(tree.audience, allowedAudiences)) {
    notFound();
  }

  return <DecisionTreeWizard tree={tree} />;
}
