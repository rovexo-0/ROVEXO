"use client";

import { useCallback, useMemo } from "react";
import {
  areRequiredAttributesComplete,
  buildSellProgressiveSteps,
  getFirstIncompleteSellStep,
  getVisibleAttributeDefs,
  isSellProgressiveStepVisible,
  scrollToSellField,
  type SellProgressiveStep,
  type SellProgressiveStepId,
} from "@/lib/sell/sell-progressive-flow";
import { useSell } from "@/features/sell/context/SellProvider";

export function useSellProgressiveFlow() {
  const { draft } = useSell();

  const pendingText = useMemo(
    () => ({
      title: draft.title,
      description: draft.description,
    }),
    [draft.description, draft.title],
  );

  const steps = useMemo(() => buildSellProgressiveSteps(draft), [draft]);
  const visibleAttributeDefs = useMemo(
    () => getVisibleAttributeDefs(draft, pendingText),
    [draft, pendingText],
  );

  const isStepVisible = useCallback(
    (stepId: SellProgressiveStepId) => {
      const step = steps.find((item) => item.id === stepId);
      if (!step) return false;
      return isSellProgressiveStepVisible(step, steps, draft, pendingText);
    },
    [draft, pendingText, steps],
  );

  const scrollToNextStep = useCallback(
    (fromStepId: SellProgressiveStepId) => {
      const fromIndex = steps.findIndex((step) => step.id === fromStepId);
      const next = steps.slice(fromIndex + 1).find((step) => isSellProgressiveStepVisible(step, steps, draft, pendingText));
      if (next) scrollToSellField(next.fieldId);
    },
    [draft, pendingText, steps],
  );

  const scrollToFirstIncomplete = useCallback(() => {
    const next = getFirstIncompleteSellStep(steps, draft, pendingText);
    if (next) scrollToSellField(next.fieldId);
  }, [draft, pendingText, steps]);

  const attributesComplete = areRequiredAttributesComplete(draft);

  return {
    steps,
    pendingText,
    visibleAttributeDefs,
    isStepVisible,
    scrollToNextStep,
    scrollToFirstIncomplete,
    attributesComplete,
  };
}

export type { SellProgressiveStep, SellProgressiveStepId };
