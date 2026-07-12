"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { usePageBack } from "@/hooks/navigation/usePageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { CDS_VERSION } from "./tokens";

export type CanonicalPageHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  className?: string;
  titleId?: string;
  /** Hub roots — no back affordance */
  hideBack?: boolean;
};

/**
 * My Account subpage header — 1:1 with platform account module chrome.
 */
export function CanonicalPageHeader({
  title,
  backHref = "/",
  backLabel = "Back",
  onBack,
  rightAction,
  className,
  titleId,
  hideBack = false,
}: CanonicalPageHeaderProps) {
  const back = usePageBack({ backHref, backLabel, preferHistory: true });

  return (
    <header
      className={cn("rx-page-header rx-canon-header cds-header sticky top-0 z-50", className)}
      data-cds-header={CDS_VERSION}
      data-canonical-page-header="v1"
    >
      <div className="cds-header__grid">
        <div className="justify-self-start">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={cn("cds-header__back", focusRing)}
              aria-label={backLabel}
            >
              <BackLineIcon />
            </button>
          ) : !hideBack && back.visible ? (
            <button
              type="button"
              onClick={back.goBack}
              className={cn("cds-header__back", focusRing)}
              aria-label={back.label}
            >
              <BackLineIcon />
            </button>
          ) : (
            <span className="cds-header__back" aria-hidden />
          )}
        </div>

        <h1 id={titleId} className="cds-header__title">
          {title}
        </h1>

        <div className="cds-header__action">{rightAction ?? <span aria-hidden className="w-12" />}</div>
      </div>
    </header>
  );
}

/** Link-based back for non-client contexts. */
export function CanonicalPageHeaderBackLink({
  href,
  label = "Back",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("cds-header__back", focusRing, className)} aria-label={label}>
      <BackLineIcon />
    </Link>
  );
}
