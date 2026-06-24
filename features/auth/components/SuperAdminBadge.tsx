import { cn } from "@/lib/cn";

type SuperAdminBadgeProps = {
  className?: string;
  compact?: boolean;
};

export function SuperAdminBadge({ className, compact = false }: SuperAdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-bold uppercase tracking-[0.14em]",
        "border-amber-400/60 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-200",
        "text-amber-950 shadow-[0_2px_12px_rgba(217,119,6,0.22)]",
        compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
        className,
      )}
    >
      Super Admin
    </span>
  );
}
