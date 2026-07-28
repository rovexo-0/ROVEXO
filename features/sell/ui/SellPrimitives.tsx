"use client";

/**
 * Sell field helpers — Account CDS only (CanonicalMenuRow).
 * No Sell-only cards, rows, or spacing systems.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { CanonicalMenuRow, CanonicalSwitch } from "@/src/components/canonical";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { SellFieldMasterIcon } from "@/features/account-center/components/MasterMenuIcon";

/** Field trigger — Profile Master Icon System + CanonicalMenuRow. */
export function SellNavRow({
  label,
  value,
  placeholder = "",
  onClick,
  ariaLabel,
  hasError = false,
  leading,
  iconFieldId,
}: {
  label: string;
  value?: string;
  /** Empty by default — Master Freeze: no Select / Choose placeholders. */
  placeholder?: string;
  onClick: () => void;
  ariaLabel?: string;
  hasError?: boolean;
  leading?: ReactNode;
  /** Master Icon System field id (category, brand, condition, …). */
  iconFieldId?: string;
}) {
  const hasValue = Boolean(value && value.trim().length > 0);
  const icon = iconFieldId ? <SellFieldMasterIcon fieldId={iconFieldId} /> : leading;
  return (
    <CanonicalMenuRow
      title={label}
      value={hasValue ? value : placeholder || undefined}
      onClick={onClick}
      showChevron
      icon={icon}
      ariaLabel={ariaLabel}
      className={cn(hasError && "cds-menu-row--error")}
    />
  );
}

export function SellInlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="cds-field__error" role="alert">
      {message}
    </p>
  );
}

/** Fullscreen picker header — Account back + title rhythm. */
export function SellPanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <header className="account-canonical-header cds-header sticky top-0 z-50">
      <div className="account-canonical-header__bar account-canonical-header__bar--titled">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className={cn("cds-header__back", focusRing)}
        >
          <BackLineIcon />
        </button>
        <h1 className="account-canonical-header__title">{title}</h1>
        <span className="account-canonical-header__spacer" aria-hidden />
      </div>
    </header>
  );
}

export { CanonicalSwitch as SellToggle };
