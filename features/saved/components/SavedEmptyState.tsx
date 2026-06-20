import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeartIcon } from "@/features/product-detail/icons";

export function SavedEmptyState() {
  return (
    <Card padding="lg" className="flex flex-col items-center gap-ds-4 py-ds-8 text-center shadow-ds-soft">
      <span className="flex h-16 w-16 items-center justify-center rounded-ds-full bg-surface-muted text-danger">
        <HeartIcon filled className="h-8 w-8" />
      </span>

      <div>
        <h2 className="text-base font-semibold text-text-primary">Nothing saved yet</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">Save items to view them later.</p>
      </div>

      <Link href="/" className="block w-full max-w-xs">
        <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
          Start Shopping
        </Button>
      </Link>
    </Card>
  );
}
