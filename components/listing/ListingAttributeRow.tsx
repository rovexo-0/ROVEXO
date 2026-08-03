"use client";

import type { ReactNode } from "react";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { ListingAttributeLabel } from "@/components/listing/ListingAttributeLabel";
import { ListingAttributeValue } from "@/components/listing/ListingAttributeValue";

export type ListingAttributeRowProps = {
  label: string;
  /** Right-aligned value (Brand, Condition, Size, …). */
  value?: string;
  /** Optional second line under the label (Category path). Never duplicates label. */
  description?: string;
  /** Master icon node — already includes cds-menu-row__icon (do not wrap again). */
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  showChevron?: boolean;
  hasError?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

/**
 * Canonical Sell attribute row (Category Row v1.0 freeze for Category):
 * Icon · ListingAttributeLabel · (description / breadcrumb) · ListingAttributeValue · Chevron
 *
 * Exactly one ListingAttributeLabel. No ListingAttributeIcon double-wrap.
 * Category path belongs in `description`, never in `value`.
 */
export function ListingAttributeRow({
  label,
  value,
  description,
  icon,
  onClick,
  disabled = false,
  showChevron = true,
  hasError = false,
  className,
  id,
  ariaLabel,
}: ListingAttributeRowProps) {
  const hasValue = Boolean(value?.trim());
  const hasDescription = Boolean(description?.trim());
  // Avoid aria-label identical to visible label (prevents a11y overlays reading Category×2).
  const resolvedAria =
    ariaLabel && ariaLabel.trim() !== label.trim()
      ? ariaLabel
      : hasValue
        ? `${label}: ${value}`
        : hasDescription
          ? `${label}: ${description}`
          : undefined;

  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={onClick}
      aria-label={resolvedAria}
      className={cn(
        "cds-menu-row",
        "listing-attribute-row",
        transitionFast,
        focusRing,
        hasError && "cds-menu-row--error",
        className,
      )}
      data-listing-attribute-row="1.0"
    >
      {icon ?? null}
      <span className="cds-menu-row__copy">
        <span className="cds-menu-row__title">
          <ListingAttributeLabel>{label}</ListingAttributeLabel>
        </span>
        {hasDescription ? (
          <span
            className="cds-menu-row__subtitle listing-attribute-row__description"
            data-category-breadcrumb={label === "Category" ? "v1.0" : undefined}
          >
            {description}
          </span>
        ) : null}
      </span>
      <span className="cds-menu-row__trailing-group listing-attribute-row__trailing">
        {hasValue ? <ListingAttributeValue>{value}</ListingAttributeValue> : null}
        {showChevron ? (
          <span className="cds-menu-row__chevron" aria-hidden>
            <ChevronRightLineIcon />
          </span>
        ) : null}
      </span>
    </button>
  );
}
