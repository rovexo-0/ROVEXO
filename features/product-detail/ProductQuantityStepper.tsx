"use client";

import { useCallback, useId, useState } from "react";

type ProductQuantityStepperProps = {
  max: number;
  value: number;
  onChange: (next: number) => void;
};

function clampQty(value: number, max: number): number {
  const ceiling = Math.max(1, Math.floor(max));
  if (!Number.isFinite(value)) return 1;
  return Math.min(ceiling, Math.max(1, Math.round(value)));
}

/**
 * Buyer quantity on product page when stock > 1.
 * Caps at available stock. Does not alter checkout totals until Buy Now passes qty.
 */
export function ProductQuantityStepper({ max, value, onChange }: ProductQuantityStepperProps) {
  const labelId = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));
  const qty = clampQty(value, max);
  const atMin = qty <= 1;
  const atMax = qty >= Math.max(1, max);

  const commit = useCallback(
    (next: number) => {
      const normalized = clampQty(next, max);
      onChange(normalized);
      setText(String(normalized));
    },
    [max, onChange],
  );

  if (max <= 1) return null;

  return (
    <div className="pd-v1__qty" data-product-quantity>
      <p id={labelId} className="pd-v1__qty-label">
        Quantity
      </p>
      <div className="pd-v1__qty-stepper" role="group" aria-labelledby={labelId}>
        <button
          type="button"
          className="pd-v1__qty-btn"
          aria-label="Decrease quantity"
          disabled={atMin}
          onClick={() => commit(qty - 1)}
        >
          −
        </button>
        {editing ? (
          <input
            className="pd-v1__qty-value-input"
            inputMode="numeric"
            aria-label="Quantity"
            value={text}
            onChange={(event) => setText(event.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={() => {
              setEditing(false);
              commit(Number(text) || 1);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="pd-v1__qty-value"
            aria-label={`Quantity ${qty}. Tap to edit.`}
            onClick={() => {
              setText(String(qty));
              setEditing(true);
            }}
          >
            {qty}
          </button>
        )}
        <button
          type="button"
          className="pd-v1__qty-btn"
          aria-label="Increase quantity"
          disabled={atMax}
          onClick={() => commit(qty + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
