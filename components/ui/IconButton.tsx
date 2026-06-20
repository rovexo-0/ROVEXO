import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  buttonVariants,
  iconButtonSizes,
  type ButtonVariant,
  type IconButtonSize,
} from "@/components/ui/variants";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonBaseProps = {
  label: string;
  variant?: ButtonVariant;
  size?: IconButtonSize;
  children: ReactNode;
  className?: string;
};

type IconButtonAsButton = IconButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type IconButtonAsLink = IconButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type IconButtonProps = IconButtonAsButton | IconButtonAsLink;

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  children,
  className,
  href,
  ...props
}: IconButtonProps) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center",
    buttonVariants[variant],
    iconButtonSizes[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={classes}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
