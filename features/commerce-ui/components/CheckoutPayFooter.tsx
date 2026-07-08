import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatGBP } from "@/features/commerce-ui/lib/format";

type CheckoutPayFooterProps = {
  total: number;
  disabled?: boolean;
  loading?: boolean;
  onPay?: () => void;
  /** When true, renders inline instead of fixed (preview frames). */
  inline?: boolean;
  className?: string;
};

/** Fixed bottom checkout CTA — full-width purple button with legal copy above. */
export function CheckoutPayFooter({
  total,
  disabled = false,
  loading = false,
  onPay,
  inline = false,
  className,
}: CheckoutPayFooterProps) {
  return (
    <div
      className={cn(
        inline
          ? "flex flex-col gap-ds-3"
          : "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-ds-4 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))] pt-ds-3 backdrop-blur",
        className,
      )}
    >
      <p className="mb-ds-3 flex items-start gap-ds-2 text-xs text-text-muted">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          By placing your order, you agree to our{" "}
          <Link href="/terms" className="font-medium text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-primary">
            Privacy Policy
          </Link>
          .
        </span>
      </p>

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={disabled || loading}
        onClick={onPay}
        className="shadow-[var(--ds-shadow-medium)]"
      >
        {loading ? "Placing order…" : `Pay ${formatGBP(total)}`}
      </Button>
    </div>
  );
}
