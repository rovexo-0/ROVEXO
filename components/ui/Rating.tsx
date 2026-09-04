import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export type RatingProps = {
  value: number;
  reviewCount?: number;
  max?: number;
  className?: string;
  size?: "sm" | "md";
};

export function Rating({
  value,
  reviewCount,
  max = 5,
  className,
  size = "md",
}: RatingProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div
      className={cn("inline-flex items-center gap-ds-1 text-text-secondary", className)}
      aria-label={`Rating ${clampedValue.toFixed(1)} out of ${max}${reviewCount != null ? `, ${reviewCount} reviews` : ""}`}
    >
      <PlatformEmoji emoji={PLATFORM_EMOJI.star} size={iconSize} className="text-star" />
      <span className={cn("font-medium text-text-primary", size === "sm" ? "text-xs" : "text-sm")}>
        {clampedValue.toFixed(1)}
      </span>
      {reviewCount != null && (
        <span className={cn(size === "sm" ? "text-xs" : "text-sm", "text-text-secondary")}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
