import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { MobileBadgeKey, MobileBadgeTone } from "@/lib/mobile-ui/types";

type MobileHubBadgeProps = {
  count: number;
  badgeKey?: MobileBadgeKey;
  tone?: MobileBadgeTone;
};

export function MobileHubBadge({ count, badgeKey, tone = "danger" }: MobileHubBadgeProps) {
  if (count <= 0) return null;

  const isWallet = badgeKey === "wallet-payout" || tone === "success";
  const resolvedTone = isWallet ? "success" : tone;

  return (
    <span
      className={cn(
        "mhub-badge",
        resolvedTone === "success" && "mhub-badge--success",
        resolvedTone === "danger" && "mhub-badge--danger",
        resolvedTone === "muted" && "mhub-badge--muted",
      )}
      aria-label={isWallet ? "Available" : `${count} unread`}
    >
      {isWallet ? "●" : count > 99 ? "99+" : count}
    </span>
  );
}

type MobileHubGridProps = {
  children: ReactNode;
  className?: string;
};

export function MobileHubGrid({ children, className }: MobileHubGridProps) {
  return <div className={cn("mhub-grid", className)}>{children}</div>;
}

type MobileHubSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export function MobileHubBlock({ id, title, children }: MobileHubSectionProps) {
  return (
    <section className="mhub-section" aria-labelledby={id}>
      <h2 id={id} className="mhub-section__title">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MobileSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="mhub-skeleton-grid" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="mhub-skeleton-card" />
      ))}
    </div>
  );
}
