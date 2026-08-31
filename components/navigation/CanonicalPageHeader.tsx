"use client";

import type { ReactNode } from "react";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { RovexoHeaderCloseButton } from "@/components/navigation/RovexoHeaderCloseButton";
import { usePageBack } from "@/hooks/navigation/usePageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ROVEXO_HEADER_STANDARD_VERSION } from "@/lib/header/rovexo-header-standard-v1";
/* OPT-HP-PERF: scoped off platform index — Orders/Account chrome (not Homepage). */
import "@/styles/rovexo/rovexo-header-standard-v1.css";
/* OPT-HP-LCP-CSS: .cds-header__* — scoped off Homepage megabundle. */
import "@/styles/rovexo/canonical-ds.css";

export type CanonicalPageHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  /**
   * @deprecated Header Standard v1.0 — right slot is always Close.
   * Ignored; Close is injected.
   */
  rightAction?: ReactNode;
  className?: string;
  titleId?: string;
  closeFallbackHref?: string;
};

/**
 * Platform-wide page header — ROVEXO Header Standard v1.0 (Orders SSOT).
 * Back · Title · Close. Homepage marketplace header excluded.
 */
export function CanonicalPageHeader({
  title,
  backHref = "/",
  backLabel = "Back",
  onBack,
  rightAction: _rightAction,
  className,
  titleId,
  closeFallbackHref,
}: CanonicalPageHeaderProps) {
  void _rightAction;
  const back = usePageBack({
    backHref,
    backLabel,
    preferHistory: true,
  });

  return (
    <header
      className={cn("rx-page-header rx-canon-header sticky top-0 z-50", className)}
      data-canonical-page-header="v1"
      data-rovexo-header-standard={ROVEXO_HEADER_STANDARD_VERSION}
    >
      <div className="rx-page-header__bar">
        <div className="rx-page-header__back">
          <button
            type="button"
            onClick={onBack ?? back.goBack}
            className={cn("cds-header__back", focusRing)}
            aria-label={onBack ? backLabel : back.label}
          >
            <BackLineIcon />
          </button>
        </div>

        <h1 id={titleId} className="rx-page-header__title">
          {title}
        </h1>

        <div className="rx-page-header__action">
          <RovexoHeaderCloseButton fallbackHref={closeFallbackHref ?? backHref} />
        </div>
      </div>
    </header>
  );
}
