"use client";

import Link from "next/link";
import {
  CanonicalCard,
  CanonicalCheckbox,
} from "@/src/components/canonical";
import type { useCheckoutForm } from "@/features/checkout/hooks/use-checkout-form";

const RETURN_WINDOW_DAYS = 14;

type CheckoutReturnPolicyProps = {
  form: ReturnType<typeof useCheckoutForm>;
};

export function CheckoutReturnPolicy({ form }: CheckoutReturnPolicyProps) {
  const { draft, updateDraft } = form;

  return (
    <CanonicalCard variant="small" className="flex w-full flex-col gap-ds-2">
      <h2 className="text-base font-semibold text-text-primary">Returns</h2>
      <p className="text-sm text-text-secondary">
        {RETURN_WINDOW_DAYS}-day case window with purchase protection.{" "}
        <Link href="/help/buying-buyer-protection" className="font-medium text-primary underline">
          Full policy
        </Link>
      </p>

      <CanonicalCheckbox
        label="I accept the return window and fees."
        checked={draft.acceptedReturnPolicy}
        onChange={(event) => updateDraft({ acceptedReturnPolicy: event.target.checked })}
      />
    </CanonicalCard>
  );
}

export { RETURN_WINDOW_DAYS };
