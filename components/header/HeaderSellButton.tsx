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
        "inline-flex h-9 shrink-0 items-center justify-center rounded-ds-full bg-primary px-ds-4 text-sm font-semibold text-primary-foreground",
        "hover:opacity-90 active:opacity-80",
        focusRing,
        transitionFast,
        className,
      )}
    >
      Sell
    </Link>
  );
}
