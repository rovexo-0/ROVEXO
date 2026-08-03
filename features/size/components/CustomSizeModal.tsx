"use client";

import { FormEvent, useId, useState } from "react";
import { CanonicalInput } from "@/src/components/canonical";
import { SIZE_ENGINE_V1, validateCustomSizeInput } from "@/lib/size";
import styles from "@/features/size/components/SizeSelector.module.css";

type CustomSizeModalProps = {
  open: boolean;
  initialValue?: string;
  canRemove?: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  onRemove?: () => void;
};

function CustomSizeModalForm({
  initialValue,
  canRemove,
  onClose,
  onSave,
  onRemove,
}: Omit<CustomSizeModalProps, "open">) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateCustomSizeInput(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSave(result.value);
  };

  return (
    <div className={styles["size-engine-modal"]} role="presentation" onClick={onClose}>
      <div
        className={styles["size-engine-modal__sheet"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${inputId}-title`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={`${inputId}-title`} className={styles["size-engine-modal__title"]}>
          Enter custom size
        </h2>
        <form onSubmit={submit}>
          <CanonicalInput
            id={inputId}
            label="Custom size"
            name="custom-size"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Example: 4XL, UK 13.5, EU 46, 46 Tall"
            maxLength={SIZE_ENGINE_V1.customMaxLength}
            autoComplete="off"
            error={error ?? undefined}
            aria-invalid={Boolean(error)}
          />
          <div className={styles["size-engine-modal__actions"]}>
            <button type="button" className={styles["size-engine-modal__btn"]} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles["size-engine-modal__btn"]} ${styles["size-engine-modal__btn--primary"]}`}
            >
              Save
            </button>
          </div>
        </form>
        {canRemove && onRemove ? (
          <button type="button" className={styles["size-engine-modal__remove"]} onClick={onRemove}>
            Remove custom size
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CustomSizeModal({
  open,
  initialValue = "",
  canRemove = false,
  onClose,
  onSave,
  onRemove,
}: CustomSizeModalProps) {
  if (!open) return null;
  return (
    <CustomSizeModalForm
      key={`custom-size-${initialValue}`}
      initialValue={initialValue}
      canRemove={canRemove}
      onClose={onClose}
      onSave={onSave}
      onRemove={onRemove}
    />
  );
}
