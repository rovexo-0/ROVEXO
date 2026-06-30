import { cn } from "@/lib/cn";
import type { OrderViewRole } from "@/lib/orders/types";

type OrderRoleBadgeProps = {
  role: OrderViewRole;
  className?: string;
};

export function OrderRoleBadge({ role, className }: OrderRoleBadgeProps) {
  const isBuying = role === "buyer";

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-ds-full px-[10px] text-xs font-semibold text-white",
        isBuying ? "bg-success" : "bg-primary",
        className,
      )}
    >
      {isBuying ? "🟢 Buying" : "🔵 Selling"}
    </span>
  );
}
