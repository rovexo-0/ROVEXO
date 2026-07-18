import Link from "next/link";
import type { ReactNode } from "react";
import { CanonicalButton, CanonicalButtonLink } from "@/src/components/canonical";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  /** @deprecated Absolute Final ignores premium illustrations */
  premiumIllustrationId?: string;
  title: string;
  description?: string;
  suggestions?: string[];
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

/** Absolute Final: compact empty state — no premium motion / illustrations. */
export function EmptyState({
  icon,
  title,
  description,
  suggestions,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex w-full flex-col items-start gap-ds-3 py-ds-6", className)}>
      {icon ? (
        <span className="inline-flex h-5 w-5 items-center justify-center text-primary" aria-hidden>
          {icon}
        </span>
      ) : null}
      <h3 className="text-[15px] font-medium text-text-primary">{title}</h3>
      {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      {suggestions?.length ? (
        <ul className="w-full space-y-ds-1 text-sm text-text-secondary">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>• {suggestion}</li>
          ))}
        </ul>
      ) : null}
      {actionLabel && actionHref ? (
        <CanonicalButtonLink href={actionHref}>{actionLabel}</CanonicalButtonLink>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <CanonicalButton onClick={onAction}>{actionLabel}</CanonicalButton>
      ) : null}
    </div>
  );
}
