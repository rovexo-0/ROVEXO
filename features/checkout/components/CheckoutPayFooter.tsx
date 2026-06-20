import { Button } from "@/components/ui/Button";

type CheckoutPayFooterProps = {
  disabled: boolean;
  loading: boolean;
  onPay: () => void;
};

export function CheckoutPayFooter({ disabled, loading, onPay }: CheckoutPayFooterProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] border-t border-border bg-surface/95 shadow-ds-floating backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-2xl px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))]">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="h-14 rounded-ds-lg text-base font-semibold"
          disabled={disabled || loading}
          onClick={onPay}
        >
          Pay Securely
        </Button>
      </div>
    </div>
  );
}
