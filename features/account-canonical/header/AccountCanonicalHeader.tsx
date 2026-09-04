"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { RovexoHeaderCloseButton } from "@/components/navigation/RovexoHeaderCloseButton";
import { usePageBack } from "@/hooks/navigation/usePageBack";
import { useAppChromeScroll } from "@/components/layout/AppChromeScrollProvider";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ROVEXO_HEADER_STANDARD_VERSION } from "@/lib/header/rovexo-header-standard-v1";
import { CDS_VERSION } from "@/src/components/canonical/tokens";
/* OPT-HP-PERF: scoped off platform index — Account chrome (not Homepage). */
import "@/styles/rovexo/rovexo-header-standard-v1.css";

export type AccountCanonicalHeaderProps = {
  className?: string;
  backLabel?: string;
  /** Centered page title (Orders header SSOT — platform standard). */
  centeredTitle?: string;
  /** History fallback when back stack is empty. Defaults to /account. */
  fallbackHref?: string;
  /**
   * When set, called instead of the default back navigation.
   * Use for unsaved-changes confirmation (Edit Listing).
   */
  onBack?: () => void;
  /**
   * Optional titled-header right slot. Default remains Close (Orders SSOT).
   * Visit Store passes overflow (`⋯`) here — do not change other pages.
   */
  rightAction?: ReactNode;
  /** Close fallback when history is empty (defaults to fallbackHref). */
  closeFallbackHref?: string;
};

const ACCOUNT_BACK_FALLBACK = "/account";

/**
 * Account / internal module header — ROVEXO Header Standard v1.0.
 * Back · Title · Close (Orders SSOT). Homepage marketplace header excluded.
 */
export function AccountCanonicalHeader({
  className,
  backLabel = "Back",
  centeredTitle,
  fallbackHref = ACCOUNT_BACK_FALLBACK,
  onBack,
  rightAction,
  closeFallbackHref,
}: AccountCanonicalHeaderProps) {
  const back = usePageBack({
    backHref: fallbackHref,
    backLabel,
    preferHistory: true,
  });
  const scroll = useAppChromeScroll();
  const registerHeader = scroll?.registerHeader;
  const isChromeVisible = scroll?.isVisible ?? true;
  const headerHeight = scroll?.headerHeight ?? 0;
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    registerHeader?.(headerRef.current);
    return () => registerHeader?.(null);
  }, [registerHeader]);

  return (
    <>
      {headerHeight > 0 ? (
        <div className="rovexo-chrome-spacer" style={{ height: headerHeight }} aria-hidden />
      ) : null}
      <header
        ref={headerRef}
        className={cn(
          "account-canonical-header cds-header sticky top-0 z-50",
          centeredTitle && "account-canonical-header--titled",
          scroll && !isChromeVisible && "rovexo-chrome--hidden",
          className,
        )}
        data-cds-header={CDS_VERSION}
        data-account-canonical-header="v1"
        data-rovexo-header-standard={ROVEXO_HEADER_STANDARD_VERSION}
        data-chrome-scroll={scroll ? "registered" : undefined}
        data-compact-header="v1"
      >
        <div
          className={cn(
            "account-canonical-header__bar",
            centeredTitle && "account-canonical-header__bar--titled",
          )}
        >
          <button
            type="button"
            onClick={onBack ?? back.goBack}
            className={cn("cds-header__back", focusRing)}
            aria-label={back.label}
          >
            <BackLineIcon />
          </button>
          {centeredTitle ? (
            <>
              <h1 className="account-canonical-header__title">{centeredTitle}</h1>
              <div className="account-canonical-header__action">
                {rightAction ?? (
                  <RovexoHeaderCloseButton fallbackHref={closeFallbackHref ?? fallbackHref} />
                )}
              </div>
            </>
          ) : null}
        </div>
      </header>
    </>
  );
}
