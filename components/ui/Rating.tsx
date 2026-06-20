import { cn } from "@/lib/cn";

export type RatingProps = {
  value: number;
  reviewCount?: number;
  max?: number;
  className?: string;
  size?: "sm" | "md";
};

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.753-.382-1.831-4.401Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Rating({
  value,
  reviewCount,
  max = 5,
  className,
  size = "md",
}: RatingProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn("inline-flex items-center gap-ds-1 text-text-secondary", className)}
      aria-label={`Rating ${clampedValue.toFixed(1)} out of ${max}${reviewCount != null ? `, ${reviewCount} reviews` : ""}`}
    >
      <StarIcon className={cn(iconSize, "text-star")} />
      <span className={cn("font-medium text-text-primary", size === "sm" ? "text-xs" : "text-sm")}>
        {clampedValue.toFixed(1)}
      </span>
      {reviewCount != null && (
        <span className={size === "sm" ? "text-xs" : "text-sm"}>({reviewCount})</span>
      )}
    </div>
  );
}
