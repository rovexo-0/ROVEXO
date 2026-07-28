"use client";

/**
 * ROVEXO GLOBAL BUTTON RECOVERY v1.0 — PrimaryButton SSOT
 * Functional Profile geometry: 56px · radius 16 · 16/600 · full width · purple.
 * Auth Login/Register Sign In stays on frozen `components/auth/PrimaryButton`.
 */

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { PRIMARY_BUTTON_DOM } from "@/lib/design-system/primary-button-v1";
import "@/styles/rovexo/primary-button-v1.css";

type SharedProps = {
  children: ReactNode;
  className?: string;
  loading?: boolean;
  /** Default true (full width). Pass false for compact placements (e.g. in-card Withdraw). */
  fullWidth?: boolean;
};

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & SharedProps;

export type PrimaryButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  SharedProps & {
    href: string;
  };

function PrimaryButtonContent({ loading, children }: { loading?: boolean; children: ReactNode }) {
  if (loading) {
    return (
      <>
        <span className="cds-button__spinner rx-primary-button__spinner" aria-hidden />
        <span>{children}</span>
      </>
    );
  }
  return <>{children}</>;
}

/** Canonical primary CTA — 56px · radius 16 · 16/600 · purple · default full width. */
export function PrimaryButton({
  className,
  loading = false,
  fullWidth = true,
  disabled,
  children,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      data-primary-button={PRIMARY_BUTTON_DOM}
      className={cn(
        "rx-primary-button",
        !fullWidth && "rx-primary-button--auto",
        loading && "cds-button--loading",
        className,
      )}
      {...props}
    >
      <PrimaryButtonContent loading={loading}>{children}</PrimaryButtonContent>
    </button>
  );
}

/** Anchor styled as PrimaryButton. */
export function PrimaryButtonLink({
  href,
  className,
  loading = false,
  fullWidth = true,
  children,
  ...props
}: PrimaryButtonLinkProps) {
  return (
    <Link
      href={href}
      data-primary-button={PRIMARY_BUTTON_DOM}
      className={cn(
        "rx-primary-button",
        !fullWidth && "rx-primary-button--auto",
        loading && "cds-button--loading",
        className,
      )}
      aria-disabled={loading || undefined}
      {...props}
    >
      <PrimaryButtonContent loading={loading}>{children}</PrimaryButtonContent>
    </Link>
  );
}
