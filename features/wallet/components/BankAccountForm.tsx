"use client";

import { useEffect, useState } from "react";
import { BankLineIcon } from "@/components/icons/RvxLineIcons";
import { CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalModal } from "@/src/components/canonical";
import {
  formatMaskedAccountLast4,
  formatMaskedSortCodeLast2,
  formatSortCode,
  resolveBankAccountDisplayName,
  validateBankAccountInput,
  type BankAccountErrors,
} from "@/lib/wallet/bank-account";
import "@/styles/rovexo/bank-accounts-v5.css";

type BankAccountFormProps = {
  open: boolean;
  connected: boolean;
  lastDigits?: string | null;
  onClose: () => void;
  onSaved: () => void;
  onRemoved?: () => void;
};

type IdentificationSummary = {
  displayName: string;
  lastDigits: string;
  sortCodeLast2: string | null;
};

const EMPTY = {
  accountHolderName: "",
  sortCode: "",
  accountNumber: "",
  confirmAccountNumber: "",
};

export function BankAccountForm({
  open,
  connected,
  lastDigits = null,
  onClose,
  onSaved,
  onRemoved,
}: BankAccountFormProps) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<BankAccountErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [summary, setSummary] = useState<IdentificationSummary>({
    displayName: "Bank Account",
    lastDigits: lastDigits ?? "",
    sortCodeLast2: null,
  });

  useEffect(() => {
    if (!open || !connected) return;

    let cancelled = false;
    void fetch("/api/wallet/bank-account?sellerContext=individual")
      .then((response) => response.json())
      .then((payload: {
        success?: boolean;
        summary?: {
          displayName?: string;
          lastDigits?: string;
          sortCodeLast2?: string | null;
        } | null;
      }) => {
        if (cancelled || !payload.success || !payload.summary) return;
        setSummary({
          displayName: resolveBankAccountDisplayName(payload.summary.displayName),
          lastDigits: payload.summary.lastDigits ?? lastDigits ?? "",
          sortCodeLast2: payload.summary.sortCodeLast2 ?? null,
        });
      })
      .catch(() => {
        /* keep last-4 from the already-public withdraw method */
      });

    return () => {
      cancelled = true;
    };
  }, [connected, lastDigits, open]);

  function reset() {
    setValues(EMPTY);
    setErrors({});
    setFormError(null);
  }

  function close() {
    if (submitting || removing) return;
    reset();
    onClose();
  }

  function update(field: keyof typeof EMPTY, raw: string) {
    const value = field === "sortCode" ? formatSortCode(raw) : raw;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function focusExistingForm() {
    const field = document.getElementById("accountHolderName");
    if (field instanceof HTMLElement) {
      field.focus();
      field.scrollIntoView({ block: "nearest" });
    }
  }

  async function submit() {
    if (submitting) return;
    setFormError(null);

    const validation = validateBankAccountInput(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/wallet/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, sellerContext: "individual" }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        errors?: BankAccountErrors;
        error?: string;
      };

      if (response.ok && payload.success) {
        reset();
        onSaved();
        return;
      }

      if (response.status === 422 && payload.errors) {
        setErrors(payload.errors);
      } else {
        setFormError(payload.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (removing) return;
    setFormError(null);
    setRemoving(true);
    try {
      const response = await fetch("/api/wallet/bank-account?sellerContext=individual", {
        method: "DELETE",
      });
      if (response.ok) {
        reset();
        onRemoved?.();
        onClose();
        return;
      }
      setFormError("Could not remove your bank account. Please try again.");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  const busy = submitting || removing;
  const visibleLast4 = summary.lastDigits || lastDigits || "";

  return (
    <CanonicalModal
      open={open}
      variant="confirm"
      title="Bank Account"
      cancelLabel="Cancel"
      confirmLabel={submitting ? "Saving…" : "Save"}
      loading={submitting}
      confirmDisabled={busy}
      onClose={close}
      onConfirm={() => void submit()}
    >
      <div className="flex flex-col gap-ds-4">
        {connected ? (
          <section className="ba-id-card" data-bank-account-id-card="v1" aria-label="Connected bank account">
            <div className="ba-id-card__top">
              <span className="ba-id-card__icon" aria-hidden>
                <BankLineIcon />
              </span>
              <div className="ba-id-card__copy">
                <p className="ba-id-card__name">{summary.displayName}</p>
                <p className="ba-id-card__meta">{formatMaskedAccountLast4(visibleLast4)}</p>
                <p className="ba-id-card__meta">{formatMaskedSortCodeLast2(summary.sortCodeLast2)}</p>
              </div>
            </div>
            <div className="ba-id-card__footer">
              <span className="ba-id-card__status">
                <span className="ba-id-card__dot" aria-hidden />
                Connected
              </span>
              <button
                type="button"
                className="ba-id-card__edit"
                onClick={focusExistingForm}
              >
                Edit
              </button>
            </div>
          </section>
        ) : null}

        <CanonicalInput
          id="accountHolderName"
          label="Account Holder"
          value={values.accountHolderName}
          autoComplete="name"
          error={errors.accountHolderName}
          onChange={(event) => update("accountHolderName", event.target.value)}
        />
        <CanonicalInput
          id="sortCode"
          label="Sort Code"
          value={values.sortCode}
          inputMode="numeric"
          maxLength={8}
          error={errors.sortCode}
          onChange={(event) => update("sortCode", event.target.value)}
        />
        <CanonicalInput
          id="accountNumber"
          label="Account Number"
          value={values.accountNumber}
          inputMode="numeric"
          maxLength={8}
          error={errors.accountNumber}
          onChange={(event) => update("accountNumber", event.target.value.replace(/\D/g, ""))}
        />
        <CanonicalInput
          id="confirmAccountNumber"
          label="Confirm Account Number"
          value={values.confirmAccountNumber}
          inputMode="numeric"
          maxLength={8}
          error={errors.confirmAccountNumber}
          onChange={(event) => update("confirmAccountNumber", event.target.value.replace(/\D/g, ""))}
        />

        {formError ? <CanonicalInfoBlock variant="error">{formError}</CanonicalInfoBlock> : null}

        {connected ? (
          <CanonicalButton
            type="button"
            variant="danger"
            onClick={() => void remove()}
            disabled={busy}
            loading={removing}
          >
            {removing ? "Removing…" : "Remove Bank Account"}
          </CanonicalButton>
        ) : null}
      </div>
    </CanonicalModal>
  );
}
