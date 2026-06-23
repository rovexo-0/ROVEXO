"use client";

import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export function VoiceSearchPlaceholder() {
  return (
    <div className="border-b border-border/60 px-ds-4 py-ds-3">
      <button
        type="button"
        disabled
        aria-label="Voice search coming soon"
        className={cn(
          "premium-card flex w-full items-center justify-between px-ds-4 py-ds-3 text-left",
          focusRing,
          transitionFast,
        )}
      >
        <span className="relative z-[1] flex items-center gap-ds-3">
          <PremiumIcon size="md" float glow label="Voice search">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 0 0 6.75-6.75v-1.5m-6.75 8.25a3.75 3.75 0 0 1-3.75-3.75v-1.5m9 0V9.75a9 9 0 0 0-9-9 9 9 0 0 0-9 9v1.5m9 0h.008v.008H12V12Z" />
            </svg>
          </PremiumIcon>
          <span>
            <span className="block text-sm font-semibold text-text-primary">Voice search</span>
            <span className="block text-xs text-text-secondary">Coming soon on mobile</span>
          </span>
        </span>
        <span className="relative z-[1] rounded-ds-full bg-primary/10 px-ds-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          Soon
        </span>
      </button>
    </div>
  );
}
