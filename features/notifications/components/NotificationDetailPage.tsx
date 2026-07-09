import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { BackIcon, NotificationTypeIcon, iconToneClass } from "@/features/notifications/icons";
import { formatNotificationTime } from "@/lib/notifications/utils";
import { fetchNotificationById } from "@/lib/notifications/queries";

type NotificationDetailPageProps = {
  id: string;
};

export async function NotificationDetailPage({ id }: NotificationDetailPageProps) {
  const notification = await fetchNotificationById(id);

  if (!notification || notification.type !== "system") {
    notFound();
  }

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="rx-page-header sticky top-0 z-50">
        <div
          className={cn(
            "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
          )}
        >
          <IconButton href="/notifications" label="Back to notifications" variant="ghost" size="md">
            <BackIcon className="h-5 w-5" />
          </IconButton>
          <h1 className="truncate text-center text-lg font-semibold text-text-primary">Details</h1>
          <span aria-hidden className="w-12" />
        </div>
      </header>

      <HubPageMain withBottomNav={false} className="mx-auto w-full max-w-2xl px-ds-4 py-ds-4 ">
        <Card padding="lg" className="flex flex-col gap-ds-4">
          <div className="flex items-start gap-ds-3">
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-full",
                iconToneClass(notification.icon),
              )}
            >
              <NotificationTypeIcon icon={notification.icon} className="h-6 w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-text-primary">{notification.title}</h2>
              <p className="mt-ds-1 text-sm text-text-secondary">{notification.subtitle}</p>
              <time dateTime={notification.createdAt} className="mt-ds-2 block text-xs text-text-muted">
                {formatNotificationTime(notification.createdAt)}
              </time>
            </div>
          </div>

          {notification.detail && (
            <p className="text-sm leading-relaxed text-text-secondary">{notification.detail}</p>
          )}

          {notification.href !== `/notifications/${notification.id}` && (
            <Link href={notification.href}>
              <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg">
                Open Related Page
              </Button>
            </Link>
          )}
        </Card>
      </HubPageMain>
    </BetaAppShell>
  );
}
