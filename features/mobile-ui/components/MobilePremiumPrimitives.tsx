import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { MobileBadgeKey, MobileBadgeTone } from "@/lib/mobile-ui/types";

type MobilePremiumBadgeProps = {
  count: number;
  badgeKey?: MobileBadgeKey;
  tone?: MobileBadgeTone;
};

export function MobilePremiumBadge({ count, badgeKey, tone = "danger" }: MobilePremiumBadgeProps) {
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
      {isWallet ? "●" : count > 9 ? "9+" : count}
    </span>
  );
}

type MobilePremiumGridProps = {
  children: ReactNode;
  className?: string;
};

export function MobilePremiumGrid({ children, className }: MobilePremiumGridProps) {
  return <div className={cn("mhub-grid", className)}>{children}</div>;
}

type MobilePremiumSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export function MobilePremiumSection({ id, title, children }: MobilePremiumSectionProps) {
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
