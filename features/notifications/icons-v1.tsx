import type { ComponentType } from "react";
import {
  BagLineIcon,
  ChatLineIcon,
  CreditCardLineIcon,
  InfoLineIcon,
  MegaphoneLineIcon,
  PeopleLineIcon,
  ShieldLineIcon,
  StarLineIcon,
  TagLineIcon,
} from "@/components/icons/RvxLineIcons";
import type { NotificationIcon } from "@/lib/notifications/types";

const iconByType: Record<NotificationIcon, ComponentType<{ className?: string }>> = {
  message: ChatLineIcon,
  order: BagLineIcon,
  offer: TagLineIcon,
  review: StarLineIcon,
  payment: CreditCardLineIcon,
  follower: PeopleLineIcon,
  moderation: ShieldLineIcon,
  promotion: MegaphoneLineIcon,
  product: TagLineIcon,
  system: InfoLineIcon,
};

export function NotificationLineIcon({ icon }: { icon: NotificationIcon }) {
  const Icon = iconByType[icon] ?? InfoLineIcon;
  return <Icon />;
}
