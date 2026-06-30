"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { useCheckoutForm } from "@/features/checkout/hooks/use-checkout-form";

const RETURN_WINDOW_DAYS = 14;

type CheckoutReturnPolicyProps = {
  form: ReturnType<typeof useCheckoutForm>;
};

export function CheckoutReturnPolicy({ form }: CheckoutReturnPolicyProps) {
  const { draft, updateDraft } = form;

  return (
    <Card padding="lg" className="">
      <h2 className="text-base font-semibold text-text-primary">Returns & buyer protection</h2>
      <p className="mt-ds-2 text-sm text-text-secondary">
        Eligible purchases include ROVEXO Buyer Protection. You may open a case within{" "}
        {RETURN_WINDOW_DAYS} days of delivery if an item is not as described.{" "}
        <Link href="/help/buying-buyer-protection" className="font-medium text-primary underline">
          Read the full policy
        </Link>
        .
      </p>

      <label
        className={cn(
          "mt-ds-4 flex cursor-pointer items-start gap-ds-3 rounded-ds-md border border-border p-ds-3",
          focusRing,
        )}
      >
        <input
          type="checkbox"
          checked={draft.acceptedReturnPolicy}
          onChange={(event) => updateDraft({ acceptedReturnPolicy: event.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary"
        />
        <span className="text-sm text-text-primary">
          I understand the return window, buyer protection fee, and resolution process.
        </span>
      </label>
    </Card>
  );
}

export { RETURN_WINDOW_DAYS };
