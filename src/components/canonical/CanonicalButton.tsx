"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
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
 * Canonical button — primary, secondary, ghost, outline, danger, loading, disabled.
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

/** Anchor styled as canonical button. */
export function CanonicalButtonLink({
  href,
  variant = "primary",
  loading = false,
  fullWidth = false,
  className,
  children,
  ...props
}: CanonicalButtonLinkProps) {
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
