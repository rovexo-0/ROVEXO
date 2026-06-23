"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";

type CheckoutAddressCardProps = {
  form: CheckoutFormController;
};

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

const fieldClassName =
  "min-h-ds-7 w-full premium-input px-ds-3 py-ds-2 text-sm placeholder:text-text-muted";

export function CheckoutAddressCard({ form }: CheckoutAddressCardProps) {
  const { draft, updateDraft } = form;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <section aria-labelledby="checkout-address-heading" className="flex flex-col gap-ds-3">
      <div className="flex items-center justify-between gap-ds-3">
        <h2 id="checkout-address-heading" className="text-base font-semibold text-text-primary">
          Delivery Address
        </h2>
        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          className={cn(
            "inline-flex min-h-ds-7 items-center gap-ds-1 text-sm font-medium text-primary",
            focusRing,
          )}
        >
          {isEditing ? "Done" : "Edit"}
          {!isEditing && <ChevronRightIcon className="h-4 w-4" />}
        </button>
      </div>

      <Card padding="md" className="">
        {isEditing ? (
          <div className="flex flex-col gap-ds-3">
            <label className="flex flex-col gap-ds-2">
              <span className="text-sm font-medium text-text-primary">Recipient Name</span>
              <input
                type="text"
                value={draft.recipientName}
                onChange={(event) => updateDraft({ recipientName: event.target.value })}
                className={cn(fieldClassName, focusRing)}
              />
            </label>
            <label className="flex flex-col gap-ds-2">
              <span className="text-sm font-medium text-text-primary">Address</span>
              <input
                type="text"
                value={draft.addressLine}
                onChange={(event) => updateDraft({ addressLine: event.target.value })}
                className={cn(fieldClassName, focusRing)}
              />
            </label>
            <label className="flex flex-col gap-ds-2">
              <span className="text-sm font-medium text-text-primary">Postcode</span>
              <input
                type="text"
                value={draft.postcode}
                onChange={(event) => updateDraft({ postcode: event.target.value })}
                className={cn(fieldClassName, focusRing)}
              />
            </label>
            <label className="flex flex-col gap-ds-2">
              <span className="text-sm font-medium text-text-primary">Country</span>
              <input
                type="text"
                value={draft.country}
                onChange={(event) => updateDraft({ country: event.target.value })}
                className={cn(fieldClassName, focusRing)}
              />
            </label>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-text-primary">
            <p className="font-semibold">{draft.recipientName}</p>
            <p className="mt-ds-1 text-text-secondary">{draft.addressLine}</p>
            <p className="text-text-secondary">{draft.postcode}</p>
            <p className="text-text-secondary">{draft.country}</p>
          </div>
        )}
      </Card>
    </section>
  );
}
