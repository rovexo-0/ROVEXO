"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_WITHDRAW_DRAFT,
  type WithdrawDraft,
  type WithdrawStep,
} from "@/lib/wallet/types";
import { parseWithdrawAmount } from "@/lib/wallet/utils";
import type { WithdrawMethod } from "@/lib/wallet/types";

type UseWithdrawFlowOptions = {
  availableBalance: number;
  methods: WithdrawMethod[];
};

export function useWithdrawFlow({ availableBalance, methods }: UseWithdrawFlowOptions) {
  const [step, setStep] = useState<WithdrawStep>("method");
  const [draft, setDraft] = useState<WithdrawDraft>(DEFAULT_WITHDRAW_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMethod = useMemo(
    () => methods.find((method) => method.id === draft.methodId) ?? null,
    [draft.methodId, methods],
  );

  const parsedAmount = useMemo(
    () => parseWithdrawAmount(draft.amount, availableBalance),
    [availableBalance, draft.amount],
  );

  const canContinue =
    step === "method"
      ? Boolean(selectedMethod?.connected)
      : step === "amount"
        ? parsedAmount > 0
        : step === "review";

  const updateDraft = (patch: Partial<WithdrawDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const goNext = () => {
    if (step === "method" && selectedMethod) {
      setStep("amount");
      return;
    }

    if (step === "amount" && parsedAmount > 0) {
      setStep("review");
    }
  };

  const goBack = () => {
    setError(null);

    if (step === "amount") {
      setStep("method");
      return;
    }

    if (step === "review") {
      setStep("amount");
    }
  };

  const confirmWithdraw = async () => {
    if (!selectedMethod || parsedAmount <= 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodId: selectedMethod.id,
          amount: parsedAmount,
        }),
      });

      if (!response.ok) {
        setError("Unable to submit withdrawal. Please try again.");
        return;
      }

      setStep("success");
    } catch {
      setError("Unable to submit withdrawal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep("method");
    setDraft(DEFAULT_WITHDRAW_DRAFT);
    setError(null);
    setIsSubmitting(false);
  };

  return {
    step,
    draft,
    methods,
    selectedMethod,
    parsedAmount,
    availableBalance,
    isSubmitting,
    error,
    canContinue,
    updateDraft,
    goNext,
    goBack,
    confirmWithdraw,
    reset,
  };
}

export type WithdrawFlowController = ReturnType<typeof useWithdrawFlow>;
