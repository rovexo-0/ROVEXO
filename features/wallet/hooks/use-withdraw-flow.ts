"use client";

import { useMemo, useRef, useState } from "react";
import {
  DEFAULT_WITHDRAW_DRAFT,
  type WithdrawDraft,
  type WithdrawStep,
} from "@/lib/wallet/types";
import { parseWithdrawAmount } from "@/lib/wallet/utils";
import type { WithdrawMethod } from "@/lib/wallet/types";
import type { SellerContext } from "@/lib/seller-context/seller-context-v1";

type UseWithdrawFlowOptions = {
  availableBalance: number;
  methods: WithdrawMethod[];
  sellerContext?: SellerContext;
};

function createWithdrawIntentKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wd-intent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useWithdrawFlow({
  availableBalance,
  methods,
  sellerContext = "individual",
}: UseWithdrawFlowOptions) {
  const [step, setStep] = useState<WithdrawStep>("method");
  const [draft, setDraft] = useState<WithdrawDraft>(DEFAULT_WITHDRAW_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intentKeyRef = useRef<string | null>(null);

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
      if (!intentKeyRef.current) {
        intentKeyRef.current = createWithdrawIntentKey();
      }
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
      intentKeyRef.current = null;
      setStep("amount");
    }
  };

  const confirmWithdraw = async () => {
    if (!selectedMethod || parsedAmount <= 0) return;

    const idempotencyKey = intentKeyRef.current ?? createWithdrawIntentKey();
    intentKeyRef.current = idempotencyKey;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          methodId: selectedMethod.id,
          amount: parsedAmount,
          idempotencyKey,
          sellerContext,
        }),
      });

      if (!response.ok) {
        setError("Unable to submit withdrawal. Please try again.");
        return;
      }

      intentKeyRef.current = null;
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
    intentKeyRef.current = null;
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
