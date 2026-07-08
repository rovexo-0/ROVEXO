import { cn } from "@/lib/cn";
import type { TransactionMode } from "@/lib/transaction-mode/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";

type ProductActionBarV1Props = {
  transactionMode: TransactionMode;
  onBuy?: () => void;
  onAddToCart?: () => void;
  onContact?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ProductActionBarV1({
  transactionMode,
  onBuy,
  onAddToCart,
  onContact,
  disabled = false,
  className,
}: ProductActionBarV1Props) {
  const directContact = isDirectContactMode(transactionMode);

  if (directContact) {
    return (
      <div className={cn("pd-v1__action-bar pd-v1__action-bar--single", className)} data-pd-action-bar>
        <button
          type="button"
          className="pd-v1__action-btn pd-v1__action-btn--solid"
          onClick={onContact}
        >
          Contact Seller
        </button>
      </div>
    );
  }

  return (
    <div className={cn("pd-v1__action-bar", className)} data-pd-action-bar>
      <button
        type="button"
        className="pd-v1__action-btn pd-v1__action-btn--outline"
        onClick={onAddToCart}
        disabled={disabled}
      >
        Add to Cart
      </button>
      <button
        type="button"
        className="pd-v1__action-btn pd-v1__action-btn--solid"
        onClick={onBuy}
        disabled={disabled}
      >
        Buy Now
      </button>
    </div>
  );
}
