import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
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
  return <PlatformEmoji emoji={PLATFORM_EMOJI.verification} size={14} className={className} />;
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
