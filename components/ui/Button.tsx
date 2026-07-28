import { cn } from "@/lib/cn";
import {
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/variants";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

function isAuthFrozenPrimary(className?: string): boolean {
  return typeof className === "string" && className.includes("auth-primary-button");
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  // Global Button Recovery v1.0 — marketplace primary CTAs (Profile functional geometry)
  // Auth Login/Register Sign In stays on frozen auth-primary-button styles.
  if (variant === "primary" && !isAuthFrozenPrimary(className)) {
    return (
      <PrimaryButton
        type={type}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
        {...props}
      >
        {children}
      </PrimaryButton>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
