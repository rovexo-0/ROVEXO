import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type PremiumButtonProps = {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function PremiumButton({
  href,
  children,
  className,
  onClick,
  type = "button",
  disabled,
}: PremiumButtonProps) {
  const styles = cn(
    "inline-flex min-h-[48px] items-center justify-center rounded-[20px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition-transform active:scale-[0.98]",
    focusRing,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={styles}>
      {children}
    </button>
  );
}
