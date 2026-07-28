"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { PrimaryButton, PrimaryButtonLink } from "@/components/ui/PrimaryButton";
import { cdsButtonClass } from "./utils";
import type { CanonicalButtonVariant } from "./tokens";

type SharedButtonProps = {
  variant?: CanonicalButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

export type CanonicalButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & SharedButtonProps;

export type CanonicalButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  SharedButtonProps & {
    href: string;
  };

function ButtonContent({ loading, children }: { loading?: boolean; children: ReactNode }) {
  if (loading) {
    return (
      <>
        <span className="cds-button__spinner" aria-hidden />
        <span>{children}</span>
      </>
    );
  }
  return <>{children}</>;
}

/**
 * Canonical button — primary delegates to Global PrimaryButton v1.0.
 * Secondary / ghost / outline / danger keep CDS variants.
 */
export function CanonicalButton({
  variant = "primary",
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: CanonicalButtonProps) {
  if (variant === "primary") {
    return (
      <PrimaryButton
        type={type}
        loading={loading}
        fullWidth
        disabled={disabled}
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
      disabled={disabled || loading}
      className={cdsButtonClass(variant, { fullWidth, loading }, className)}
      {...props}
    >
      <ButtonContent loading={loading}>{children}</ButtonContent>
    </button>
  );
}

/** Anchor styled as canonical button — primary → PrimaryButtonLink. */
export function CanonicalButtonLink({
  href,
  variant = "primary",
  loading = false,
  fullWidth = false,
  className,
  children,
  ...props
}: CanonicalButtonLinkProps) {
  if (variant === "primary") {
    return (
      <PrimaryButtonLink href={href} loading={loading} fullWidth className={className} {...props}>
        {children}
      </PrimaryButtonLink>
    );
  }

  return (
    <Link
      href={href}
      className={cdsButtonClass(variant, { fullWidth, loading }, className)}
      {...props}
    >
      <ButtonContent loading={loading}>{children}</ButtonContent>
    </Link>
  );
}
