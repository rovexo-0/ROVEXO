import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { DecisionTreeWizard } from "@/features/help/components/DecisionTreeWizard";
import { getHelpTopic } from "@/lib/help/content/topics";
import { getDecisionTree } from "@/lib/help/decision-trees/registry";

type HelpCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: HelpCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getHelpTopic(slug);
  if (!topic) return { title: "Help topic not found" };
  return {
    title: `${topic.label} Help | ROVEXO Help Center`,
    description: topic.description,
  };
}

export default async function HelpCategoryPage({ params }: HelpCategoryPageProps) {
  const { slug } = await params;
  const topic = getHelpTopic(slug);
  const tree = getDecisionTree(slug as Parameters<typeof getDecisionTree>[0]);

  if (!topic || !tree) {
    notFound();
  }

  return (
    <BetaAppShell showBottomNav={false}>
      <DecisionTreeWizard tree={tree} />
    </BetaAppShell>
  );
}
