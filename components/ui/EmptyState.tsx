import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { MotionDiv } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <MotionDiv
      className={cn(
        "premium-card flex flex-col items-center justify-center px-ds-6 py-ds-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="premium-icon-3d mb-ds-4 flex h-16 w-16 items-center justify-center rounded-ds-xl text-primary premium-float">
          {icon}
        </div>
      ) : null}
      <h3 className="relative z-[1] text-lg font-semibold tracking-tight text-text-primary">{title}</h3>
      <p className="relative z-[1] mt-ds-2 max-w-sm text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
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
