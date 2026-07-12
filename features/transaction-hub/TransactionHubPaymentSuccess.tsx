"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { CanonicalButton } from "@/src/components/canonical";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { TRANSACTION_HUB_COPY } from "@/lib/transaction-hub/canonical";

type TransactionHubPaymentSuccessProps = {
  open: boolean;
  orderId: string;
  orderNumber?: string | null;
  onContinueChat: () => void;
};

/** Payment success overlay — stays inside the Transaction Hub conversation. */
export function TransactionHubPaymentSuccess({
  open,
  orderId,
  orderNumber,
  onContinueChat,
}: TransactionHubPaymentSuccessProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <ModalContainer
      open
      onClose={onContinueChat}
      variant="centered"
      zIndex={240}
      ariaLabel="Payment successful"
      lockScroll
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-ds-4 p-ds-6 text-center">
        <span
          className="grid h-14 w-14 place-items-center rounded-ds-full bg-success/15 text-success"
          aria-hidden
        >
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col gap-ds-1">
          <h2 className="text-lg font-semibold text-text-primary">
            {TRANSACTION_HUB_COPY.paymentSuccessful}
          </h2>
          {orderNumber ? (
            <p className="text-sm text-text-secondary">Order #{orderNumber}</p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-ds-2">
          <CanonicalButton
            fullWidth
            onClick={() => {
              router.push(`/orders/${orderId}?placed=1`);
            }}
          >
            {TRANSACTION_HUB_COPY.viewOrder}
          </CanonicalButton>
          <CanonicalButton fullWidth variant="outline" onClick={onContinueChat}>
            {TRANSACTION_HUB_COPY.continueChat}
          </CanonicalButton>
        </div>
      </div>
    </ModalContainer>
  );
}
