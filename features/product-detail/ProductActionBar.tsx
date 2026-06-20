import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type ProductActionBarProps = {
  onMessage?: () => void;
  onBuy?: () => void;
  onAddToCart?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ProductActionBar({
  onMessage,
  onBuy,
  onAddToCart,
  disabled = false,
  className,
}: ProductActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[110] border-t border-border bg-surface/95 shadow-ds-floating backdrop-blur-xl backdrop-saturate-150",
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
