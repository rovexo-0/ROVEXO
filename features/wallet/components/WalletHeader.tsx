import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { BellIcon } from "@/features/dashboard/icons";

type WalletHeaderProps = {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  unreadNotifications: number;
};

/** @deprecated Use CanonicalPageHeader directly. */
export function WalletHeader({
  title = "Wallet",
  backHref = "/wallet",
  onBack,
  unreadNotifications,
}: WalletHeaderProps) {
  return (
    <CanonicalPageHeader
      title={title}
      backHref={backHref}
      onBack={onBack}
      rightAction={
        <Link
          href="/notifications"
          aria-label={
            unreadNotifications > 0
              ? `Notifications, ${unreadNotifications} unread`
              : "Notifications"
          }
          className={cn(
            "relative inline-flex min-h-ds-7 min-w-ds-7 items-center justify-center rounded-ds-md text-text-primary",
            focusRing,
          )}
        >
          <BellIcon className="h-5 w-5" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-ds-full bg-danger px-1 text-[0.625rem] font-bold text-danger-foreground">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          ) : null}
        </Link>
      }
    />
  );
}
