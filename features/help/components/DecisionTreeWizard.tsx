"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HelpResolutionPrompt } from "@/features/help/components/HelpResolutionPrompt";
import { HelpSolutionView } from "@/features/help/components/HelpSolutionView";
import { getHelpTopic } from "@/lib/help/content/topics";
import { resolveDecisionOption } from "@/lib/help/decision-trees/engine";
import type { DecisionTree, HelpSolution } from "@/lib/help/types";
import {
  appendHelpSessionStep,
  markSolutionViewed,
  readHelpSession,
  startHelpSession,
  trackHelpEvent,
} from "@/lib/help/session";

type DecisionTreeWizardProps = {
  tree: DecisionTree;
};

export function DecisionTreeWizard({ tree }: DecisionTreeWizardProps) {
  const router = useRouter();
  const topic = getHelpTopic(tree.topicSlug);
  const [nodeId, setNodeId] = useState(tree.rootNodeId);
  const [solution, setSolution] = useState<HelpSolution | null>(null);
  const [history, setHistory] = useState<string[]>([tree.rootNodeId]);

  useEffect(() => {
    startHelpSession(tree.topicSlug);
    void trackHelpEvent({ type: "tree_start", topicSlug: tree.topicSlug });
  }, [tree.topicSlug]);

  const currentNode = useMemo(() => tree.nodes[nodeId] ?? null, [tree, nodeId]);

  const chooseOption = (optionId: string) => {
    const session = readHelpSession();
    const resolved = resolveDecisionOption(tree, nodeId, optionId);
    if (!resolved.option) return;

    if (resolved.option.topicSlug && resolved.option.topicSlug !== tree.topicSlug) {
      router.push(`/help/category/${resolved.option.topicSlug}`);
      return;
    }

    if (resolved.option.articleSlug) {
      router.push(`/help/${resolved.option.articleSlug}`);
      return;
    }

    let nextSession = appendHelpSessionStep(session, {
      nodeId,
      optionId,
      label: resolved.option.label,
    });
    void trackHelpEvent({
      type: "tree_step",
      topicSlug: tree.topicSlug,
      path: nextSession.path,
    });

    if (resolved.solution) {
      nextSession = markSolutionViewed(nextSession, resolved.solution.id);
      setSolution(resolved.solution);
      void trackHelpEvent({
        type: "solution_view",
        topicSlug: tree.topicSlug,
        solutionId: resolved.solution.id,
        path: nextSession.path,
      });
      void trackHelpEvent({ type: "tree_complete", topicSlug: tree.topicSlug, path: nextSession.path });
      return;
    }

    if (resolved.nextNode) {
      setNodeId(resolved.nextNode.id);
      setHistory((items) => [...items, resolved.nextNode!.id]);
    }
  };

  const goBack = () => {
    if (solution) {
      setSolution(null);
      return;
    }
    if (history.length <= 1) return;
    const nextHistory = history.slice(0, -1);
    setHistory(nextHistory);
    setNodeId(nextHistory[nextHistory.length - 1]!);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-ds-6 px-ds-4 py-ds-6">
      <div>
        <Link href="/help" className="text-sm font-medium text-primary hover:underline">
          ← Help Centre
        </Link>
        <p className="mt-ds-3 text-sm text-text-muted">
          {topic?.icon} {topic?.label}
        </p>
        <h1 className="mt-ds-1 text-2xl font-bold text-text-primary">{tree.title}</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Interactive guided troubleshooting — select the option that best matches your issue.
        </p>
      </div>

      {solution ? (
        <>
          <HelpSolutionView solution={solution} topicSlug={tree.topicSlug} />
          <HelpResolutionPrompt topicSlug={tree.topicSlug} />
          <Button variant="secondary" onClick={goBack}>
            Continue troubleshooting
          </Button>
        </>
      ) : currentNode ? (
        <Card padding="lg" className="shadow-ds-soft transition-opacity duration-200">
          <h2 className="text-lg font-semibold text-text-primary">{currentNode.question}</h2>
          <div className="mt-ds-5 space-y-ds-2">
            {currentNode.options.map((optionEntry) => (
              <button
                key={optionEntry.id}
                type="button"
                onClick={() => chooseOption(optionEntry.id)}
                className="flex w-full items-center gap-ds-3 rounded-ds-lg border border-border bg-surface px-ds-4 py-ds-3 text-left text-sm text-text-primary transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="inline-flex h-4 w-4 rounded-full border border-border" aria-hidden />
                {optionEntry.label}
              </button>
            ))}
          </div>
          {history.length > 1 ? (
            <Button variant="secondary" className="mt-ds-5" onClick={goBack}>
              Back
            </Button>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
