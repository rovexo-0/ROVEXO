"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";


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
    <AccountCanonicalShell title={topic?.label ?? "Help"} backHref="/help" backLabel="Help Centre" showHeaderTitle>
      <CanonicalInfoBlock variant="description">
        <p className="cds-menu-row__title">{tree.title}</p>
        <p className="mt-ds-2">
          Interactive guided troubleshooting — select the option that best matches your issue.
        </p>
      </CanonicalInfoBlock>

      {solution ? (
        <>
          <HelpSolutionView solution={solution} topicSlug={tree.topicSlug} />
          <HelpResolutionPrompt topicSlug={tree.topicSlug} />
          <CanonicalButton variant="secondary" onClick={goBack}>
            Continue troubleshooting
          </CanonicalButton>
        </>
      ) : currentNode ? (
        <CanonicalSection title={currentNode.question}>
          <CanonicalCard variant="list">
            {currentNode.options.map((optionEntry) => (
              <CanonicalMenuRow
                key={optionEntry.id}
                title={optionEntry.label}
                onClick={() => chooseOption(optionEntry.id)}
              />
            ))}
          </CanonicalCard>
          {history.length > 1 ? (
            <CanonicalButton variant="secondary" className="mt-ds-4" onClick={goBack}>
              Back
            </CanonicalButton>
          ) : null}
        </CanonicalSection>
      ) : null}
    </AccountCanonicalShell>
  );
}
