import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type HeaderSellButtonProps = {
  className?: string;
};

export function HeaderSellButton({ className }: HeaderSellButtonProps) {
  return (
    <Link
      href="/sell"
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center rounded-ds-full px-ds-4 text-sm font-semibold text-primary-foreground",
        "bg-[image:var(--ds-gradient-primary)]",
        "hover:scale-[1.02] hover:shadow-ds-medium active:scale-[0.98]",
        focusRing,
        transitionFast,
        className,
      )}
    >
      Sell
    </Link>
  );
}
