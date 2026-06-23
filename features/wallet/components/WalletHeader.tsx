import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { BellIcon } from "@/features/dashboard/icons";

type WalletHeaderProps = {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  unreadNotifications: number;
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

export function WalletHeader({
  title = "Wallet",
  backHref = "/seller/wallet",
  onBack,
  unreadNotifications,
}: WalletHeaderProps) {
  return (
    <header className="premium-page-header sticky top-0 z-50">
      <div
        className={cn(
          "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
          "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
        )}
      >
        {onBack ? (
          <IconButton
            label="Go back"
            variant="ghost"
            size="md"
            className="justify-self-start"
            onClick={onBack}
          >
            <BackIcon className="h-5 w-5" />
          </IconButton>
        ) : (
          <IconButton href={backHref} label="Go back" variant="ghost" size="md" className="justify-self-start">
            <BackIcon className="h-5 w-5" />
          </IconButton>
        )}

        <h1 className="truncate text-center text-lg font-semibold text-text-primary">{title}</h1>

        <Link
          href="/notifications"
          aria-label={
            unreadNotifications > 0
              ? `Notifications, ${unreadNotifications} unread`
              : "Notifications"
          }
          className={cn(
            "relative inline-flex min-h-ds-7 min-w-ds-7 items-center justify-center justify-self-end rounded-ds-md text-text-primary",
            focusRing,
          )}
        >
          <BellIcon className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-ds-full bg-danger px-1 text-[0.625rem] font-bold text-danger-foreground">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
