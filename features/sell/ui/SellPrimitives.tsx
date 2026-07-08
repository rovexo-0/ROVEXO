"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { sellCard, focusRing } from "@/features/sell/ui/sell-classes";

/** Card section. Heading is optional — omit `title` for a clean, title-less card. */
export function SellSection({
  title,
  children,
  "aria-label": ariaLabel,
}: {
  title?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <section className={sellCard} aria-label={ariaLabel ?? title}>
      {title ? <h2 className="text-sm font-semibold text-text-primary">{title}</h2> : null}
      {children}
    </section>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0 text-text-muted" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

/** Tappable row that opens a picker; shows a value or placeholder. */
export function SellNavRow({
  label,
  value,
  placeholder,
  onClick,
  ariaLabel,
  hasError = false,
  recommended = false,
  leading,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onClick: () => void;
  ariaLabel?: string;
  hasError?: boolean;
  recommended?: boolean;
  leading?: ReactNode;
}) {
  const hasValue = Boolean(value && value.trim().length > 0);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={cn(
        "flex min-h-ds-7 w-full items-center justify-between gap-ds-3 rounded-ds-md border border-transparent bg-surface-muted/40 px-ds-3 py-ds-2 text-left transition-colors active:bg-surface-muted",
        hasError && "border-danger/50",
        focusRing,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-primary">
          {label}
          {recommended ? <span className="ml-1 text-xs font-normal text-text-muted">(recommended)</span> : null}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-ds-2">
        {leading}
        <span className={cn("truncate text-sm", hasValue ? "text-text-primary" : "text-text-muted")}>
          {hasValue ? value : placeholder}
        </span>
        <ChevronRight />
      </span>
    </button>
  );
}

/** Thin, card-like container that groups one or more compact rows with dividers. */
export function SellRowsCard({
  children,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="overflow-hidden rounded-ds-lg border border-border bg-surface shadow-ds-soft [&>*+*]:border-t [&>*+*]:border-border"
    >
      {children}
    </div>
  );
}

/**
 * Ultra-compact tappable row (label on top, value below) used for Category,
 * Parcel size and similar picker triggers. Minimal height, no nested card —
 * keeps the Sell page tight on small phones.
 */
export function SellCompactRow({
  label,
  value,
  placeholder,
  onClick,
  ariaLabel,
  hasError = false,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onClick: () => void;
  ariaLabel?: string;
  hasError?: boolean;
}) {
  const hasValue = Boolean(value && value.trim().length > 0);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={cn(
        "flex min-h-[54px] w-full items-center justify-between gap-ds-3 px-ds-4 py-ds-2 text-left transition-colors active:bg-surface-muted/60",
        hasError && "bg-danger/5",
        focusRing,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-text-muted">{label}</span>
        <span className={cn("block truncate text-sm", hasValue ? "font-medium text-text-primary" : "text-text-muted")}>
          {hasValue ? value : placeholder}
        </span>
      </span>
      <ChevronRight />
    </button>
  );
}

/** Accessible on/off switch. */
export function SellToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-ds-full transition-colors",
        checked ? "bg-primary" : "bg-text-muted/40",
        focusRing,
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-ds-full bg-white shadow-ds-soft transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function Sign({ minus }: { minus?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5" aria-hidden>
      {minus ? (
        <path strokeLinecap="round" d="M5 12h14" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
      )}
    </svg>
  );
}

/** Quantity stepper (minimum 1, no negatives). */
export function SellStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div className="flex items-center justify-between gap-ds-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">Stock</p>
        <p className="text-xs text-text-muted">Number of items available</p>
      </div>
      <div className="flex items-center gap-ds-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label="Decrease quantity"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-ds-full border border-border text-text-primary disabled:opacity-40",
            focusRing,
          )}
        >
          <Sign minus />
        </button>
        <span className="w-8 text-center text-base font-semibold tabular-nums text-text-primary" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label="Increase quantity"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-ds-full border border-border text-text-primary disabled:opacity-40",
            focusRing,
          )}
        >
          <Sign />
        </button>
      </div>
    </div>
  );
}

export function SellInlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs font-medium text-danger" role="alert">
      {message}
    </p>
  );
}

export function SellPanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <header
      className="flex items-center gap-ds-2 border-b border-border px-ds-2 pb-ds-3"
      style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-ds-md text-text-primary", focusRing)}
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">{title}</h1>
      <span className="h-12 w-12 shrink-0" aria-hidden />
    </header>
  );
}
