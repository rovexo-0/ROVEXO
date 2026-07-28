"use client";

import { useId, useState } from "react";
import { CanonicalModal } from "@/src/components/canonical";
import { INVENTORY_MAX, INVENTORY_MIN, parseInventoryInput } from "@/lib/sell/inventory";

type RestockListingDialogProps = {
  open: boolean;
  listingId: string;
  listingTitle: string;
  currentQuantity: number;
  onClose: () => void;
  onSaved: () => void;
};

function RestockListingForm({
  listingId,
  listingTitle,
  currentQuantity,
  saving,
  error,
  onCancel,
  onSave,
}: {
  listingId: string;
  listingTitle: string;
  currentQuantity: number;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (next: number) => void;
}) {
  const inputId = useId();
  const [value, setValue] = useState(
    String(Math.max(INVENTORY_MIN, currentQuantity || INVENTORY_MIN)),
  );

  return (
    <CanonicalModal
      open
      onClose={() => {
        if (saving) return;
        onCancel();
      }}
      title="Restock"
      cancelLabel="Cancel"
      confirmLabel={saving ? "Saving…" : "Save"}
      loading={saving}
      onConfirm={() => {
        const next = parseInventoryInput(value, currentQuantity);
        if (next < INVENTORY_MIN || next > INVENTORY_MAX) {
          onSave(-1);
          return;
        }
        onSave(next);
      }}
    >
      <div className="flex w-full flex-col gap-3">
        <p className="text-sm text-text-secondary">{listingTitle}</p>
        <p className="text-sm text-text-secondary">
          Current quantity:{" "}
          <strong className="text-text-primary">{Math.max(0, currentQuantity)}</strong>
        </p>
        <label htmlFor={inputId} className="cds-field__label">
          New quantity
        </label>
        <input
          id={inputId}
          className="cds-input"
          inputMode="numeric"
          autoComplete="off"
          aria-label="New quantity"
          placeholder="Enter quantity"
          value={value}
          disabled={saving}
          onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, 5))}
        />
        <p className="text-xs text-text-muted">Replaces the current quantity (does not add).</p>
        {error ? (
          <p className="cds-field__error" role="alert">
            {error}
          </p>
        ) : null}
        <span className="sr-only" data-listing-id={listingId}>
          {listingId}
        </span>
      </div>
    </CanonicalModal>
  );
}

/**
 * Restock — replaces quantity (does not add to current).
 * PATCH /api/listings/[id] inventory.stock
 */
export function RestockListingDialog({
  open,
  listingId,
  listingTitle,
  currentQuantity,
  onClose,
  onSaved,
}: RestockListingDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const save = async (next: number) => {
    if (next < INVENTORY_MIN || next > INVENTORY_MAX) {
      setError(`Enter a whole number from ${INVENTORY_MIN} to ${INVENTORY_MAX}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: { stock: next },
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to restock listing.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to restock listing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RestockListingForm
      key={`${listingId}-${currentQuantity}-${open}`}
      listingId={listingId}
      listingTitle={listingTitle}
      currentQuantity={currentQuantity}
      saving={saving}
      error={error}
      onCancel={onClose}
      onSave={(next) => void save(next)}
    />
  );
}
