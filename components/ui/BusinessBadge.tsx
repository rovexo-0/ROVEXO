import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/** ROVEXO canonical business verification badge — single source of truth. */
export type BusinessBadgeKind =
  | "business"
  | "wholesale"
  | "manufacturer"
  | "supplier";

export type BusinessBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  kind?: BusinessBadgeKind;
  /** Compact pill for listing cards and inline metadata rows. */
  compact?: boolean;
};

const LABELS: Record<BusinessBadgeKind, string> = {
  business: "Verified Business",
  wholesale: "Verified Wholesale",
  manufacturer: "Verified Manufacturer",
  supplier: "Verified Supplier",
};

function BadgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M10 1.5 12.09 3.02l2.58-.02.79 2.45 2.09 1.5-.8 2.45.8 2.45-2.09 1.5-.79 2.45-2.58-.02L10 18.5l-2.09-1.52-2.58.02-.79-2.45L2.45 13l.8-2.45-.8-2.45 2.09-1.5.79-2.45 2.58.02L10 1.5Z" />
      <path
        d="M8.6 12.3 6.4 10.1l1.06-1.06 1.14 1.14 3-3L12.66 8.2 8.6 12.3Z"
        fill="var(--ds-color-success-foreground, #fff)"
      />
    </svg>
  );
}

export function BusinessBadge({
  kind = "business",
  compact = false,
  className,
  children,
  ...props
}: BusinessBadgeProps) {
  const label = children ?? LABELS[kind];

  return (
    <span
      data-business-badge={kind}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-ds-full font-semibold text-success-foreground",
        compact
          ? "shrink-0 bg-success/90 px-1.5 py-0.5 text-[10px] leading-none tracking-wide"
          : "bg-success px-ds-2.5 py-ds-1 text-xs",
        className,
      )}
      {...props}
    >
      <BadgeIcon className={compact ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function resolveBusinessBadgeKinds(input: {
  verifiedBusiness?: boolean;
  verifiedWholesale?: boolean;
  verifiedManufacturer?: boolean;
  verifiedSupplier?: boolean;
  accountType?: string;
  sellerTier?: string | null;
}): BusinessBadgeKind[] {
  const kinds: BusinessBadgeKind[] = [];

  if (input.verifiedBusiness) kinds.push("business");
  if (input.verifiedWholesale) kinds.push("wholesale");
  if (input.verifiedManufacturer) kinds.push("manufacturer");
  if (input.verifiedSupplier) kinds.push("supplier");

  if (
    kinds.length === 0 &&
    (input.accountType === "account" ||
      input.accountType === "business" ||
      input.sellerTier === "business")
  ) {
    kinds.push("business");
  }

  return kinds;
}
