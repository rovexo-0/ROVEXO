"use client";

import { useState } from "react";
import { CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalModal } from "@/src/components/canonical";
import {
  formatSortCode,
  validateBankAccountInput,
  type BankAccountErrors,
} from "@/lib/wallet/bank-account";

type BankAccountFormProps = {
  open: boolean;
  connected: boolean;
  onClose: () => void;
  onSaved: () => void;
  onRemoved?: () => void;
};

const EMPTY = {
  accountHolderName: "",
  sortCode: "",
  accountNumber: "",
  confirmAccountNumber: "",
};

export function BankAccountForm({ open, connected, onClose, onSaved, onRemoved }: BankAccountFormProps) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<BankAccountErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);

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
        body: JSON.stringify(values),
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
      const response = await fetch("/api/wallet/bank-account", { method: "DELETE" });
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
