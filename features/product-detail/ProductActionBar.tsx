import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { TransactionMode } from "@/lib/transaction-mode/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";

type ProductActionBarProps = {
  transactionMode: TransactionMode;
  onMessage?: () => void;
  onBuy?: () => void;
  onAddToCart?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ProductActionBar({
  transactionMode,
  onMessage,
  onBuy,
  onAddToCart,
  disabled = false,
  className,
}: ProductActionBarProps) {
  const directContact = isDirectContactMode(transactionMode);

  if (directContact) {
    return (
      <div
        className={cn(
          "rx-footer-bar fixed inset-x-0 bottom-0 z-[110]",
          className,
        )}
      >
        <div className="flex gap-ds-2 px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))]">
          <Button
            variant="primary"
            className="h-[60px] flex-1 rounded-ds-lg text-base font-semibold"
            onClick={onMessage}
          >
            Contact Seller
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rx-footer-bar fixed inset-x-0 bottom-0 z-[110]",
        className,
      )}
    >
      <div className="flex gap-ds-2 px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))]">
        <Button
          variant="outline"
          className="h-[60px] min-w-[56px] rounded-ds-lg px-ds-3 text-base font-semibold"
          onClick={onMessage}
        >
          Message
        </Button>
        <Button
          variant="outline"
          className="h-[60px] flex-1 rounded-ds-lg text-base font-semibold"
          onClick={onAddToCart}
          disabled={disabled}
        >
          Add to Cart
        </Button>
        <Button
          variant="primary"
          className="h-[60px] flex-1 rounded-ds-lg text-base font-semibold"
          onClick={onBuy}
          disabled={disabled}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
