import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";

type PremiumButtonProps = {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

/** @deprecated Use `Button` from `@/components/ui/Button` */
export function PremiumButton({ href, children, className, onClick, type = "button", disabled }: PremiumButtonProps) {
  const styles = cn(buttonVariants.primary, buttonSizes.lg, className);

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <Button type={type} onClick={onClick} disabled={disabled} variant="primary" size="lg" className={className}>
      {children}
    </Button>
  );
}
