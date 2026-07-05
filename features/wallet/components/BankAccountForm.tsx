"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
};

const EMPTY = {
  accountHolderName: "",
  sortCode: "",
  accountNumber: "",
  confirmAccountNumber: "",
};

export function BankAccountForm({ open, connected, onClose, onSaved }: BankAccountFormProps) {
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
        onSaved();
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
    <Modal
      open={open}
      onClose={close}
      title={connected ? "Manage bank account" : "Add bank account"}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {submitting ? "Saving…" : "Save bank account"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-ds-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field
          label="Account holder name"
          value={values.accountHolderName}
          error={errors.accountHolderName}
          autoComplete="name"
          placeholder="e.g. Alex Taylor"
          onChange={(value) => update("accountHolderName", value)}
        />
        <Field
          label="Sort code"
          value={values.sortCode}
          error={errors.sortCode}
          inputMode="numeric"
          placeholder="12-34-56"
          maxLength={8}
          onChange={(value) => update("sortCode", value)}
        />
        <Field
          label="Account number"
          value={values.accountNumber}
          error={errors.accountNumber}
          inputMode="numeric"
          placeholder="12345678"
          maxLength={8}
          onChange={(value) => update("accountNumber", value.replace(/\D/g, ""))}
        />
        <Field
          label="Confirm account number"
          value={values.confirmAccountNumber}
          error={errors.confirmAccountNumber}
          inputMode="numeric"
          placeholder="12345678"
          maxLength={8}
          onChange={(value) => update("confirmAccountNumber", value.replace(/\D/g, ""))}
        />

        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        ) : null}

        {/* Submit on Enter without a visible duplicate button. */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Save
        </button>
      </form>

      {connected ? (
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className="mt-ds-4 text-sm font-semibold text-danger hover:underline disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove bank account"}
        </button>
      ) : null}
    </Modal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  error,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  onChange,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-ds-2">
      <label htmlFor={id} className="text-sm font-semibold text-text-primary">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
