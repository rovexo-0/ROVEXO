"use client";

import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type SearchInputActionsProps = {
  /** Optional voice-search handler. When omitted, mic renders disabled. */
  onVoice?: () => void;
  className?: string;
};

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 11a6 6 0 0 1-12 0M12 18v3" />
    </svg>
  );
}

function ActionButton({
  label,
  available,
  onClick,
  children,
}: {
  label: string;
  available: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={available ? onClick : undefined}
      aria-label={available ? label : `${label} (coming soon)`}
      aria-disabled={!available}
      title={available ? label : `${label} — coming soon`}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-full text-text-muted hover:bg-secondary hover:text-text-primary",
        focusRing,
        transitionFast,
        !available && "opacity-45 hover:bg-transparent hover:text-text-muted",
      )}
    >
      {children}
    </button>
  );
}

/** Search overlay trailing actions — voice only (Module 1: camera removed). */
export function SearchInputActions({ onVoice, className }: SearchInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <ActionButton label="Voice search" available={Boolean(onVoice)} onClick={onVoice}>
        <MicIcon className="h-5 w-5" />
      </ActionButton>
    </div>
  );
}
