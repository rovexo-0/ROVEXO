"use client";

/**
 * Withdraw Page v7.0 FINAL — Absolute Authority · FROZEN
 * States ONLY: loading · empty · functional · success
 * Soft fails → empty (“No funds available.”). Never unavailable soft-fail copy.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { PrimaryButton } from "@/src/components/canonical";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, parseWithdrawAmount } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";
import {
  WITHDRAW_PAGE_DOM,
  WITHDRAW_PAGE_FREEZE,
  WITHDRAW_PAGE_VERSION,
  WITHDRAW_SOFT_COPY,
  buildWithdrawPageView,
  isWithdrawAmountOverMax,
  type WithdrawSoftFail,
} from "@/lib/wallet/withdraw-page-v7";
import "@/styles/rovexo/withdraw-v7.css";

type WithdrawPageProps = {
  data: WalletData;
  softFail?: WithdrawSoftFail;
  initialLoading?: boolean;
};

type ModalKind = "none" | "bank" | "confirm" | "success";

export function WithdrawPage({
  data,
  softFail: softFailProp = null,
  initialLoading = false,
}: WithdrawPageProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const [softFail, setSoftFail] = useState<WithdrawSoftFail>(softFailProp);
  const [modal, setModal] = useState<ModalKind>("none");

  const view = useMemo(
    () =>
      buildWithdrawPageView(data, {
        success: successAmount !== null,
        loading: initialLoading,
        softFail,
      }),
    [data, successAmount, softFail, initialLoading],
  );

  const connectedMethod = useMemo(
    () => data.withdrawMethods.find((method) => method.connected) ?? null,
    [data.withdrawMethods],
  );

  const overMax = useMemo(
    () => isWithdrawAmountOverMax(amount, view.available),
    [amount, view.available],
  );

  const parsedAmount = useMemo(
    () => parseWithdrawAmount(amount, view.available),
    [amount, view.available],
  );

  const canSubmit =
    view.withdrawEnabled &&
    parsedAmount > 0 &&
    !overMax &&
    !isSubmitting &&
    view.state === "functional";

  const openWithdrawFlow = () => {
    if (!canSubmit) return;
    if (!view.hasBankAccount || !connectedMethod) {
      setModal("bank");
      return;
    }
    setModal("confirm");
  };

  const submitWithdraw = async () => {
    if (!connectedMethod || parsedAmount <= 0) {
      setModal("bank");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodId: connectedMethod.id,
          amount: parsedAmount,
        }),
      });

      if (!response.ok) {
        setModal("none");
        setSoftFail("api");
        setAmount("");
        return;
      }

      setSuccessAmount(parsedAmount);
      setModal("success");
    } catch {
      setModal("none");
      setSoftFail("network");
      setAmount("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccess = () => {
    setModal("none");
    router.push(view.walletHref);
    router.refresh();
  };

  return (
    <AccountCanonicalShell
      title="Withdraw"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
      dataMyAccountSurface="withdraw"
    >
      <div
        className="wd-v7 fw-engine__stack"
        data-withdraw-ui={WITHDRAW_PAGE_VERSION}
        data-withdraw-lock={WITHDRAW_PAGE_DOM}
        data-withdraw-freeze={WITHDRAW_PAGE_FREEZE}
        data-withdraw-state={view.state}
        data-profile-master="v7.0"
        data-design-master="profile"
        data-full-width-surface="withdraw"
        data-fail-closed="v7-empty-only"
      >
        {view.state === "loading" ? <WithdrawLoadingState /> : null}

        {view.state === "empty" ? (
          <WithdrawEmptyState
            available={view.available}
            softMessage={view.softMessage}
          />
        ) : null}

        {view.state === "functional" || view.state === "success" ? (
          <WithdrawFunctionalState
            available={view.available}
            amount={amount}
            onAmountChange={setAmount}
            parsedAmount={parsedAmount}
            overMax={overMax}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            onWithdraw={openWithdrawFlow}
          />
        ) : null}

        {modal === "bank" ? (
          <WithdrawModal
            title={WITHDRAW_SOFT_COPY.bankTitle}
            body={WITHDRAW_SOFT_COPY.bankBody}
            primaryLabel="Add Bank Account"
            secondaryLabel="Cancel"
            onPrimary={() => {
              setModal("none");
              router.push(view.bankHref);
            }}
            onSecondary={() => setModal("none")}
          />
        ) : null}

        {modal === "confirm" ? (
          <WithdrawModal
            title="Confirm withdrawal"
            amount={parsedAmount}
            primaryLabel={isSubmitting ? "Processing…" : "Withdraw"}
            secondaryLabel="Cancel"
            primaryLoading={isSubmitting}
            onPrimary={() => void submitWithdraw()}
            onSecondary={() => {
              if (!isSubmitting) setModal("none");
            }}
          />
        ) : null}

        {modal === "success" && successAmount !== null ? (
          <WithdrawModal
            title={WITHDRAW_SOFT_COPY.successTitle}
            metaLabel={WITHDRAW_SOFT_COPY.amountLabel}
            metaValue={formatCurrency(successAmount)}
            secondaryMetaLabel={WITHDRAW_SOFT_COPY.estimatedArrivalLabel}
            secondaryMetaValue={view.estimatedArrival}
            primaryLabel="Done"
            onPrimary={closeSuccess}
          />
        ) : null}
      </div>
    </AccountCanonicalShell>
  );
}

function WithdrawLoadingState() {
  return (
    <>
      <section className="wd-v7__card" aria-label="Loading withdraw" data-wd-loading="true">
        <div className="wd-v7__skeleton" />
        <div className="wd-v7__skeleton wd-v7__skeleton--lg" />
      </section>
      <div className="wd-v7__cta">
        <PrimaryButton type="button" disabled>
          Withdraw
        </PrimaryButton>
      </div>
    </>
  );
}

function WithdrawEmptyState({
  available,
  softMessage,
}: {
  available: number;
  softMessage: string | null;
}) {
  return (
    <>
      <section className="wd-v7__card" aria-label="Available Balance">
        <p className="wd-v7__label">Available Balance</p>
        <p className="wd-v7__balance-amount">{formatCurrency(available)}</p>
      </section>

      <p className="wd-v7__soft" role="status">
        {softMessage ?? WITHDRAW_SOFT_COPY.noFunds}
      </p>

      <div className="wd-v7__cta">
        <PrimaryButton type="button" disabled data-withdraw-continue="true">
          Withdraw
        </PrimaryButton>
      </div>
    </>
  );
}

function WithdrawFunctionalState({
  available,
  amount,
  onAmountChange,
  parsedAmount,
  overMax,
  canSubmit,
  isSubmitting,
  onWithdraw,
}: {
  available: number;
  amount: string;
  onAmountChange: (value: string) => void;
  parsedAmount: number;
  overMax: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  onWithdraw: () => void;
}) {
  const receive = overMax ? 0 : parsedAmount > 0 ? parsedAmount : 0;

  return (
    <>
      <section className="wd-v7__card" aria-label="Available Balance">
        <p className="wd-v7__label">Available Balance</p>
        <p className="wd-v7__balance-amount">{formatCurrency(available)}</p>
      </section>

      <section className="wd-v7__amount" aria-label="Withdrawal amount">
        <label htmlFor="withdraw-amount" className="wd-v7__field-label">
          Withdrawal amount
        </label>
        <div className="wd-v7__amount-row">
          <span className="wd-v7__currency" aria-hidden>
            £
          </span>
          <input
            id="withdraw-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            className="wd-v7__amount-input"
            autoComplete="off"
          />
        </div>
        <div className="wd-v7__amount-meta">
          <button
            type="button"
            className="wd-v7__withdraw-all"
            onClick={() => onAmountChange(available.toFixed(2))}
          >
            Withdraw all
          </button>
        </div>
        {overMax ? (
          <p className="wd-v7__soft" role="status">
            {WITHDRAW_SOFT_COPY.overMax}
          </p>
        ) : null}
      </section>

      <section className="wd-v7__card" aria-label="You will receive">
        <p className="wd-v7__label">You will receive</p>
        <p className="wd-v7__receive-amount">{formatCurrency(receive)}</p>
      </section>

      <div className="wd-v7__cta">
        <PrimaryButton
          type="button"
          disabled={!canSubmit}
          loading={isSubmitting}
          onClick={onWithdraw}
          data-withdraw-continue="true"
        >
          Withdraw
        </PrimaryButton>
      </div>
    </>
  );
}

function WithdrawModal({
  title,
  body,
  amount,
  metaLabel,
  metaValue,
  secondaryMetaLabel,
  secondaryMetaValue,
  primaryLabel,
  secondaryLabel,
  primaryLoading,
  onPrimary,
  onSecondary,
}: {
  title: string;
  body?: string;
  amount?: number;
  metaLabel?: string;
  metaValue?: string;
  secondaryMetaLabel?: string;
  secondaryMetaValue?: string;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryLoading?: boolean;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  return (
    <div className="wd-v7__modal-backdrop" role="presentation" onClick={onSecondary}>
      <div
        className="wd-v7__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wd-v7-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="wd-v7-modal-title" className="wd-v7__modal-title">
          {title}
        </h2>
        {typeof amount === "number" ? (
          <p className="wd-v7__modal-amount">{formatCurrency(amount)}</p>
        ) : null}
        {metaLabel && metaValue ? (
          <p className="wd-v7__modal-meta">
            {metaLabel}
            <strong>{metaValue}</strong>
          </p>
        ) : null}
        {secondaryMetaLabel && secondaryMetaValue ? (
          <p className="wd-v7__modal-meta">
            {secondaryMetaLabel}
            <strong>{secondaryMetaValue}</strong>
          </p>
        ) : null}
        {body ? <p className="wd-v7__modal-body">{body}</p> : null}
        <div className="wd-v7__modal-actions">
          <PrimaryButton type="button" loading={primaryLoading} onClick={onPrimary}>
            {primaryLabel}
          </PrimaryButton>
          {secondaryLabel && onSecondary ? (
            <button type="button" className="wd-v7__modal-ghost" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const WITHDRAW_PAGE_ROUTE = WALLET_ROUTES.withdraw;
