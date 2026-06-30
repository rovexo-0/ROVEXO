import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
};

const roundedStyles = {
  sm: "rounded-ds-sm",
  md: "rounded-ds-md",
  lg: "rounded-[var(--ds-radius-premium)]",
  full: "rounded-ds-full",
} as const;

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("rx-skeleton", roundedStyles[rounded], className)}
    />
  );
}

type SkeletonBlockProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className }: SkeletonBlockProps) {
  return (
    <div className={cn("flex flex-col gap-ds-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
