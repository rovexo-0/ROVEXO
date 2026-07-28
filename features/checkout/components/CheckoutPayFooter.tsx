import { Button } from "@/components/ui/Button";

type CheckoutPayFooterProps = {
  disabled: boolean;
  loading: boolean;
  onPay: () => void;
};

export function CheckoutPayFooter({ disabled, loading, onPay }: CheckoutPayFooterProps) {
  return (
    <div className="rx-footer-bar fixed inset-x-0 bottom-0 z-[110]">
      <div className="w-full max-w-none px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))]">
        <Button
          variant="primary"
          fullWidth
          disabled={disabled || loading}
          onClick={onPay}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
