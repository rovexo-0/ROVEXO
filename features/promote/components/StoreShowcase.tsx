"use client";

/**
 * Store Showcase — user-facing promote card.
 * Shows ONLY: title · 7 Days · £6.30 · promote list.
 * Never shows decay / row / ranking math.
 */

import { STORE_SHOWCASE_USER_COPY } from "@/lib/promote/constants";
import type { StoreShowcaseVisibilityResult } from "@/lib/master-engine";

export type StoreShowcaseProps = {
  visibility: StoreShowcaseVisibilityResult;
  canPurchase: boolean;
  disabledReason?: string | null;
  onContinue: () => void;
  busy?: boolean;
};

export function StoreShowcase({
  visibility,
  canPurchase,
  disabledReason,
  onContinue,
  busy = false,
}: StoreShowcaseProps) {
  if (!visibility.visible) {
    return null;
  }

  const disabled = !visibility.enabled || !canPurchase || busy;

  return (
    <section
      className="store-showcase-v1"
      data-store-showcase="v1.0"
      aria-labelledby="store-showcase-title"
    >
      <div className="store-showcase-v1__card">
        <h2 id="store-showcase-title" className="store-showcase-v1__title">
          {STORE_SHOWCASE_USER_COPY.title}
        </h2>
        <p className="store-showcase-v1__meta">
          <span>{STORE_SHOWCASE_USER_COPY.durationLabel}</span>
          <span aria-hidden> · </span>
          <span>{STORE_SHOWCASE_USER_COPY.priceLabel}</span>
        </p>
        <p className="store-showcase-v1__tagline">{STORE_SHOWCASE_USER_COPY.tagline}</p>
        <div className="store-showcase-v1__promotes">
          <p className="store-showcase-v1__promotes-label">Promotes:</p>
          <ul>
            {STORE_SHOWCASE_USER_COPY.promotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        {disabledReason ? (
          <p className="store-showcase-v1__hint" role="status">
            {disabledReason}
          </p>
        ) : null}
        <button
          type="button"
          className="store-showcase-v1__cta"
          disabled={disabled}
          onClick={onContinue}
        >
          {busy ? "Starting…" : "Continue"}
        </button>
      </div>
    </section>
  );
}
