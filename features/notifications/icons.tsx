import type { ComponentType, SVGProps } from "react";
import type { NotificationIcon } from "@/lib/notifications/types";
import {
  BackLineIcon,
  BellLineIcon,
  BagLineIcon,
  ChatLineIcon,
  CheckLineIcon,
  HeartLineIcon,
  MegaphoneLineIcon,
  PeopleLineIcon,
  ShieldLineIcon,
  SettingsLineIcon,
  StarLineIcon,
  TagLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

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

function TrashLineIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4 7h16M9 7V5h6v2M8 7l.8 12h6.4L16 7" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return <TrashLineIcon {...props} />;
}

const notificationIcons: Record<NotificationIcon, ComponentType<IconProps>> = {
  message: ChatLineIcon,
  order: BagLineIcon,
  offer: TagLineIcon,
  review: StarLineIcon,
  payment: WalletLineIcon,
  follower: PeopleLineIcon,
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
