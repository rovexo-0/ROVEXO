"use client";

/**
 * Sell field helpers — Account CDS + Listing Attribute Design System.
 * Header SSOT: SellFlowHeader (= SellPanelHeader) — no Size-specific headers.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { CanonicalSwitch } from "@/src/components/canonical";
import { ListingAttributeRow } from "@/components/listing/ListingAttributeRow";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { SellFieldMasterIcon } from "@/features/account-center/components/MasterMenuIcon";

/** Field trigger — ListingAttributeRow (icon · label · value · chevron). */
export function SellNavRow({
  label,
  value,
  description,
  placeholder = "",
  onClick,
  ariaLabel,
  hasError = false,
  leading,
  iconFieldId,
}: {
  label: string;
  value?: string;
  /** Second line under label (Category path). */
  description?: string;
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
    <ListingAttributeRow
      label={label}
      value={hasValue ? value : placeholder || undefined}
      description={description}
      onClick={onClick}
      icon={icon}
      ariaLabel={ariaLabel}
      hasError={hasError}
      showChevron
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

/**
 * Canonical Sell Flow / selector header (Brand · Condition · Colour · Size · …).
 * Single SSOT — never recreate for Size or any picker.
 */
export function SellPanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <header
      className="account-canonical-header cds-header sell-compact-picker__header sticky top-0 z-50"
      data-sell-flow-header="1.0"
    >
      <div className="account-canonical-header__bar account-canonical-header__bar--titled">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className={cn("cds-header__back", focusRing)}
        >
          <BackLineIcon />
        </button>
        <h1 className="account-canonical-header__title sell-compact-picker__title">{title}</h1>
        <span className="account-canonical-header__spacer" aria-hidden />
      </div>
    </header>
  );
}

/** Owner name for the same header SSOT — Size and every Sell modal must use this. */
export const SellFlowHeader = SellPanelHeader;

export { CanonicalSwitch as SellToggle };
