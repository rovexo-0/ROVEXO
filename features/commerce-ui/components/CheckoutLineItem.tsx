"use client";

import { useState, type ReactNode } from "react";
import { AccountIcon } from "@/components/account/AccountIcons";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { formatGBP } from "@/features/commerce-ui/lib/format";
import type { CommerceLineItem } from "@/features/commerce-ui/types";

type CheckoutLineItemProps = {
  item: CommerceLineItem;
  /** Show icon-only Remove / Save actions (checkout only). */
  showActions?: boolean;
  onRemove?: (itemId: string) => void;
  onToggleSave?: (itemId: string, saved: boolean) => void;
};

function IconAction({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex flex-col items-center gap-ds-1 rounded-ds-md px-ds-2 py-ds-1 text-text-muted hover:text-text-primary",
        active && "text-primary hover:text-primary",
        focusRing,
        transitionFast,
      )}
    >
      <span aria-hidden>{icon}</span>
      <span className="text-[0.6875rem] font-medium leading-none">{label}</span>
    </button>
  );
}

/** Single product row for checkout: image, title, quantity, price + subtle actions. */
export function CheckoutLineItem({
  item,
  showActions = false,
  onRemove,
  onToggleSave,
}: CheckoutLineItemProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex items-start gap-ds-3 py-ds-3 first:pt-0 last:pb-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
        <SafeImage src={item.imageUrl} alt={item.title} fill className="object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-ds-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
            <p className="mt-ds-1 text-xs text-text-secondary">Qty × {item.quantity}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-text-primary">
            {formatGBP(item.price)}
          </span>
        </div>

        {showActions ? (
          <div className="mt-ds-2 flex items-center gap-ds-1">
            <IconAction
              label="Remove"
              icon={<AccountIcon name="returns" className="h-4 w-4" />}
              onClick={() => onRemove?.(item.id)}
            />
            <IconAction
              label="Save for later"
              active={saved}
              icon={<AccountIcon name="saved" className="h-4 w-4" />}
              onClick={() => {
                const next = !saved;
                setSaved(next);
                onToggleSave?.(item.id, next);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
