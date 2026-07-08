"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  BUMP_DURATIONS,
  FEATURE_DURATIONS,
  type BumpDurationOption,
  type FeatureDurationOption,
  type PromotionType,
} from "@/lib/promotions/config";
import { focusRing } from "@/components/ui/tokens";

type PromotionPickerProps = {
  open: boolean;
  type: PromotionType;
  listingTitle: string;
  busy?: boolean;
  onSelect: (durationId: string, scheduledStartAt?: string | null) => void;
  onCancel: () => void;
};

export function PromotionPicker({
  open,
  type,
  listingTitle,
  busy = false,
  onSelect,
  onCancel,
}: PromotionPickerProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [boostOptions, setBoostOptions] = useState<BumpDurationOption[]>(BUMP_DURATIONS);
  const [showcaseOptions, setShowcaseOptions] = useState<FeatureDurationOption[]>(FEATURE_DURATIONS);
  const options = type === "bump" ? boostOptions : showcaseOptions;
  const title = type === "bump" ? "Bump listing" : "Showcase listing";
  const description =
    type === "bump"
      ? "Move your listing to the top of search results for the selected duration."
      : "Highlight your listing in a dedicated Showcase section on the homepage.";

  useEffect(() => {
    if (!open) return;
    void fetch("/api/promotions/pricing")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { boost?: BumpDurationOption[]; showcase?: FeatureDurationOption[] } | null) => {
        if (payload?.boost?.length) setBoostOptions(payload.boost);
        if (payload?.showcase?.length) setShowcaseOptions(payload.showcase);
      })
      .catch(() => {
        setBoostOptions(BUMP_DURATIONS);
        setShowcaseOptions(FEATURE_DURATIONS);
      });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center px-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-overlay"
        onClick={onCancel}
      />

      <Card
        padding="md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-picker-title"
        aria-describedby="promotion-picker-description"
        className="relative w-full max-w-sm shadow-ds-floating"
      >
        <h2 id="promotion-picker-title" className="text-base font-semibold text-text-primary">
          {title}
        </h2>
        <p id="promotion-picker-description" className="mt-ds-1 text-sm text-text-secondary">
          {description}
        </p>
        <p className="mt-ds-2 truncate text-xs font-medium text-text-primary">{listingTitle}</p>

        <label className="mt-ds-4 flex items-center gap-ds-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={(event) => setScheduleEnabled(event.target.checked)}
          />
          Schedule for later
        </label>
        {scheduleEnabled ? (
          <input
            type="datetime-local"
            value={scheduledStartAt}
            onChange={(event) => setScheduledStartAt(event.target.value)}
            className="mt-ds-2 w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
          />
        ) : null}

        <div className="mt-ds-4 flex flex-col gap-ds-2">
          {options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              fullWidth
              size="md"
              disabled={busy}
              className="min-h-ds-7 justify-between rounded-ds-lg px-ds-4"
              onClick={() =>
                onSelect(
                  option.id,
                  scheduleEnabled && scheduledStartAt
                    ? new Date(scheduledStartAt).toISOString()
                    : null,
                )
              }
            >
              <span>{option.label}</span>
              <span className="font-semibold text-primary">{option.priceLabel}</span>
            </Button>
          ))}

          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className={cn(
              "min-h-ds-7 rounded-ds-lg px-ds-4 py-ds-3 text-sm font-semibold text-text-primary",
              focusRing,
            )}
          >
            Cancel
          </button>
        </div>
      </Card>
    </div>
  );
}
