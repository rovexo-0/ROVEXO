import Link from "next/link";
import type { ReactNode } from "react";
import { PremiumEmptyStateImage } from "@/components/ui/PremiumEmptyStateImage";
import { Button } from "@/components/ui/Button";
import { MotionDiv } from "@/components/ui/motion";
import type { PremiumEmptyStateId } from "@/lib/premium-design/empty-state-library";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  premiumIllustrationId?: PremiumEmptyStateId;
  title: string;
  description?: string;
  suggestions?: string[];
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon,
  premiumIllustrationId,
  title,
  description,
  suggestions,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <MotionDiv
      className={cn(
        "rx-surface-card flex flex-col items-center justify-center px-ds-6 py-ds-8 text-center",
        className,
      )}
    >
      {premiumIllustrationId ? (
        <PremiumEmptyStateImage id={premiumIllustrationId} className="mb-ds-4" />
      ) : icon ? (
        <div className="rx-icon-3d mb-ds-4 flex h-16 w-16 items-center justify-center rounded-ds-xl text-primary rx-float">
          {icon}
        </div>
      ) : null}
      <h3 className="relative z-[1] text-lg font-semibold tracking-tight text-text-primary">{title}</h3>
      {description ? (
        <p className="relative z-[1] mt-ds-2 max-w-sm text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}
      {suggestions?.length ? (
        <ul className="relative z-[1] mt-ds-4 max-w-sm space-y-ds-2 text-left text-sm text-text-secondary">
          {suggestions.map((suggestion) => (
            <li key={suggestion} className="flex items-start gap-ds-2">
              <span aria-hidden className="mt-0.5 text-primary">
                •
              </span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="relative z-[1] mt-ds-5">
          <Button size="md">{actionLabel}</Button>
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <Button size="md" className="relative z-[1] mt-ds-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </MotionDiv>
  );
}
