import type { NotificationIcon } from "@/lib/notifications/types";
import type { Fluency3DIconKey } from "@/lib/icons/fluency-3d-registry";
import { createFluencyClassIcon } from "@/components/icons/fluency-3d-feature";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";

export const SettingsIcon = createFluencyClassIcon("feature-settings");
export const BellIcon = createFluencyClassIcon("feature-bell");

const notificationIconKeys: Record<NotificationIcon, Fluency3DIconKey> = {
  message: "feature-notif-message",
  order: "feature-notif-order",
  offer: "feature-notif-offer",
  review: "sa-reviews",
  payment: "feature-payment",
  follower: "feature-followers",
  moderation: "feature-shield",
  promotion: "sa-promotions",
  product: "inventory",
  system: "feature-notif-system",
};

export function NotificationTypeIcon({
  icon,
  className,
}: {
  icon: NotificationIcon;
  className?: string;
}) {
  return <Fluency3DIcon icon={notificationIconKeys[icon]} size={20} className={className} />;
}

export const BackIcon = createFluencyClassIcon("feature-back");
export const CheckIcon = createFluencyClassIcon("feature-notif-check");
export const TrashIcon = createFluencyClassIcon("feature-notif-trash");

export function iconToneClass(icon: NotificationIcon): string {
  switch (icon) {
    case "message":
      return "bg-primary/10 text-primary";
    case "order":
      return "bg-success/10 text-success";
    case "offer":
      return "bg-warning/10 text-warning";
    case "review":
      return "bg-primary/10 text-primary";
    case "product":
      return "bg-secondary text-text-primary";
    case "system":
      return "bg-surface-muted text-text-secondary";
    default:
      return "bg-surface-muted text-text-secondary";
  }
}
