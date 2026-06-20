import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BellIcon } from "@/features/notifications/icons";

export function NotificationsEmptyState() {
  return (
    <Card padding="lg" className="flex flex-col items-center gap-ds-4 py-ds-8 text-center shadow-ds-soft">
      <span className="flex h-16 w-16 items-center justify-center rounded-ds-full bg-surface-muted text-primary">
        <BellIcon className="h-8 w-8" />
      </span>

      <div>
        <h2 className="text-base font-semibold text-text-primary">You&apos;re all caught up!</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">No new notifications.</p>
      </div>

      <Link href="/" className="block w-full max-w-xs">
        <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
          Browse Listings
        </Button>
      </Link>
    </Card>
  );
}
