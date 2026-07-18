/**
 * Messages hub — Absolute Final PO lock.
 * Conversations · Offers · Order Updates · Payment Updates · Tracking Updates.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";

export type MessagesMenuItem = {
  id: string;
  title: string;
  href: string;
  icon: AccountIconName;
};

export type MessagesMenuSection = {
  id: string;
  title: string;
  items: MessagesMenuItem[];
};

export const MESSAGES_HUB_INTRO = "Messages and updates.";

export function buildMessagesMenuSections(): MessagesMenuSection[] {
  return [
    {
      id: "messages",
      title: "",
      items: [
        {
          id: "conversations",
          title: "Conversations",
          href: INBOX_ROUTES.messagesTab,
          icon: "messages",
        },
        {
          id: "offers",
          title: "Offers",
          href: `${INBOX_ROUTES.hub}?tab=messages&filter=offers`,
          icon: "promotions",
        },
        {
          id: "order-updates",
          title: "Order Updates",
          href: `${INBOX_ROUTES.notificationsTab}&category=orders`,
          icon: "orders",
        },
        {
          id: "payment-updates",
          title: "Payment Updates",
          href: `${INBOX_ROUTES.notificationsTab}&category=payments`,
          icon: "payment",
        },
        {
          id: "tracking-updates",
          title: "Tracking Updates",
          href: `${INBOX_ROUTES.notificationsTab}&category=shipping`,
          icon: "shipping",
        },
      ],
    },
  ];
}
