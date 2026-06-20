import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, ShieldIcon } from "@/features/product-detail/icons";

/** Beta v1.0 — Buyer Protection Fee UI. TODO(beta): connect fee amount and checkout flow. */
export function ProductBuyerProtection() {
  return (
    <Card
      interactive
      padding="sm"
      role="button"
      tabIndex={0}
      aria-label="Buyer Protection details"
      className="flex items-center gap-ds-3 shadow-ds-soft"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-success/10 text-success">
        <ShieldIcon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text-primary">Buyer Protection</span>
        <span className="block text-xs text-text-secondary">Protection Fee applies</span>
      </span>

      <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
    </Card>
  );
}
