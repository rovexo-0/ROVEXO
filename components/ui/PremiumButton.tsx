/**
 * ROVEXO Premium Button System v1.0 — SINGLE SOURCE OF TRUTH
 *
 * Visit Store / Browse / View All family. Social Follow permanently removed.
 */

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import css from "@/components/ui/PremiumButton.module.css";

export type PremiumButtonVariant = "primary" | "secondary";
export type PremiumButtonSize = "sm" | "md";

type SharedProps = {
  variant?: PremiumButtonVariant;
  size?: PremiumButtonSize;
  /** Equal pair dimensions for Visit Store–family CTAs. */
  pair?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

type ClassNameProps = Omit<SharedProps, "children">;

export type PremiumButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
  };

export type PremiumButtonLinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href"> & {
    href: string;
  };

function variantClass(variant: PremiumButtonVariant): string {
  if (variant === "secondary") return css.secondary;
  return css.primary;
}

function premiumClassName({
  variant = "primary",
  size = "sm",
  pair,
  fullWidth,
  className,
}: ClassNameProps) {
  const isPairFamily =
    pair !== false && (variant === "primary" || variant === "secondary");

  return cn(
    css.root,
    variantClass(variant),
    size === "md" ? css.md : css.sm,
    isPairFamily && !fullWidth && css.pair,
    fullWidth && css.fullWidth,
    className,
  );
}

function Shine() {
  return <span className={css.shine} aria-hidden />;
}

/** Premium action button. */
export function PremiumButton({
  variant = "primary",
  size = "sm",
  pair,
  fullWidth = false,
  className,
  children,
  type = "button",
  disabled,
  ...props
}: PremiumButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={premiumClassName({ variant, size, pair, fullWidth, className })}
      data-premium-button="v1.0"
      data-variant={variant}
      {...props}
    >
      <Shine />
      <span className={css.label}>{children}</span>
    </button>
  );
}

/** Premium link (Visit Store). */
export function PremiumButtonLink({
  href,
  variant = "primary",
  size = "sm",
  pair,
  fullWidth = false,
  className,
  children,
  ...props
}: PremiumButtonLinkProps) {
  return (
    <Link
      href={href}
      className={premiumClassName({ variant, size, pair, fullWidth, className })}
      data-premium-button="v1.0"
      data-variant={variant}
      {...props}
    >
      <Shine />
      <span className={css.label}>{children}</span>
    </Link>
  );
}
