"use client";

import type { ReactNode } from "react";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { PageBack } from "@/components/navigation/PageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type CanonicalPageHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  className?: string;
  titleId?: string;
};

/**
 * Platform-wide page header — back (left), title (center), optional action (right).
 * Back uses browser history when available; otherwise navigates to `backHref` (default `/`).
 */
export function CanonicalPageHeader({
  title,
  backHref = "/",
  backLabel = "Back",
  onBack,
  rightAction,
  className,
  titleId,
}: CanonicalPageHeaderProps) {
  return (
    <header
      className={cn("rx-page-header rx-canon-header sticky top-0 z-50", className)}
      data-canonical-page-header="v1"
    >
      <div
        className={cn(
          "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
          "pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]",
        )}
      >
        <div className="justify-self-start">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "inline-flex h-12 w-12 items-center justify-center rounded-full text-text-primary",
                focusRing,
              )}
              aria-label={backLabel}
            >
              <BackLineIcon />
            </button>
          ) : (
            <PageBack
              backHref={backHref}
              backLabel={backLabel}
              preferHistory
              className="justify-self-start"
            />
          )}
        </div>

        <h1
          id={titleId}
          className="truncate text-center text-lg font-semibold text-text-primary"
        >
          {title}
        </h1>

        <div className="flex min-h-12 min-w-12 items-center justify-end justify-self-end">
          {rightAction ?? <span aria-hidden className="w-12" />}
        </div>
      </div>
    </header>
  );
}
