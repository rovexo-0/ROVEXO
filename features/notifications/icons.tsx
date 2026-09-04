import type { ComponentType } from "react";
import type { NotificationIcon } from "@/lib/notifications/types";
import {
  BackLineIcon,
  BellLineIcon,
  BagLineIcon,
  ChatLineIcon,
  CheckLineIcon,
  HeartLineIcon,
  MegaphoneLineIcon,
  ShieldLineIcon,
  SettingsLineIcon,
  StarLineIcon,
  TagLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type IconProps = { className?: string };

export function SettingsIcon(props: IconProps) {
  return <SettingsLineIcon {...props} />;
}

export function BellIcon(props: IconProps) {
  return <BellLineIcon {...props} />;
}

export function BackIcon(props: IconProps) {
  return <BackLineIcon {...props} />;
}

export function CheckIcon(props: IconProps) {
  return <CheckLineIcon {...props} />;
}

export function TrashIcon(props: IconProps) {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.delete} {...props} />;
}

const notificationIcons: Record<NotificationIcon, ComponentType<IconProps>> = {
  message: ChatLineIcon,
  order: BagLineIcon,
  offer: TagLineIcon,
  review: StarLineIcon,
  payment: WalletLineIcon,
  moderation: ShieldLineIcon,
  promotion: MegaphoneLineIcon,
  product: TagLineIcon,
  system: BellLineIcon,
};

export function NotificationTypeIcon({
  icon,
  className,
}: {
  icon: NotificationIcon;
  className?: string;
}) {
  const Icon = notificationIcons[icon] ?? BellLineIcon;
  return <Icon className={className} />;
}

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

export function SavedToneIcon(props: IconProps) {
  return <HeartLineIcon {...props} />;
}
