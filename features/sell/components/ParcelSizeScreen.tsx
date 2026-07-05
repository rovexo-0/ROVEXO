"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { Button } from "@/components/ui/Button";
import { PARCEL_SIZE_OPTIONS, type ParcelSize } from "@/features/sell/types";

type ParcelSizeScreenProps = {
  open: boolean;
  value: ParcelSize | null;
  onClose: () => void;
  onSelect: (size: ParcelSize) => void;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

export function ParcelSizeScreen({ open, value, onClose, onSelect }: ParcelSizeScreenProps) {
  if (!open) return null;
  return (
    <ParcelSizeScreenPanel
      key={value ?? "none"}
      value={value}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}

function ParcelSizeScreenPanel({
  value,
  onClose,
  onSelect,
}: Omit<ParcelSizeScreenProps, "open">) {
  const [selected, setSelected] = useState<ParcelSize | null>(value);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleDone = () => {
    if (selected) onSelect(selected);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select parcel size"
      className="fixed inset-0 z-[200] flex flex-col bg-surface"
    >
      <header
        className="flex items-center gap-ds-2 border-b border-border px-ds-4 pb-ds-3"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className={cn(
            "-ml-ds-1 grid h-12 w-12 shrink-0 place-items-center rounded-ds-md text-text-primary",
            focusRing,
          )}
        >
          <BackIcon />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">Parcel size</h1>
      </header>

      <div
        className="flex-1 overflow-y-auto px-ds-4 pt-ds-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        <p className="px-ds-1 pb-ds-3 text-sm text-text-secondary">
          Choose the closest size so buyers get accurate shipping and automatic labels.
        </p>
        <ul className="flex flex-col gap-ds-2" role="radiogroup" aria-label="Parcel size">
          {PARCEL_SIZE_OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(option.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[16px] border-2 p-ds-4 text-left transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-surface-muted/40",
                    focusRing,
                  )}
                  style={{ minHeight: 64 }}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                      isSelected ? "border-primary" : "border-border",
                    )}
                    aria-hidden
                  >
                    {isSelected ? <span className="h-3 w-3 rounded-full bg-primary" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-ds-2">
                      <span className="text-base font-semibold text-text-primary">{option.label}</span>
                      {option.recommended ? (
                        <span className="rounded-ds-sm bg-primary/10 px-ds-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary">
                          Recommended
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm text-text-secondary">{option.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className="border-t border-border px-ds-4 py-ds-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="min-h-ds-7 rounded-ds-lg text-base"
          disabled={!selected}
          onClick={handleDone}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
