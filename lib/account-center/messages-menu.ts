/**
 * Messages hub — Absolute Final Freeze (Transaction Hub).
 * Inbox · Orders · Tracking · Messages · Reviews · Support · Refunds · Disputes.
 * Not a chat application.
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

export const MESSAGES_HUB_INTRO = "Transaction hub.";

export function buildMessagesMenuSections(): MessagesMenuSection[] {
  return [
    {
      id: "transaction-hub",
      title: "",
      items: [
        {
          id: "inbox",
          title: "Inbox",
          href: INBOX_ROUTES.hub,
          icon: "messages",
        },
        {
          id: "orders",
          title: "Orders",
          href: "/orders?tab=bought",
          icon: "orders",
        },
        {
          id: "tracking",
          title: "Tracking",
          href: "/orders?tab=bought&status=in_progress",
          icon: "shipping",
        },
        {
          id: "messages",
          title: "Messages",
          href: INBOX_ROUTES.messagesTab,
          icon: "messages",
        },
        {
          id: "reviews",
          title: "Reviews",
          href: "/account/reviews",
          icon: "reviews",
        },
        {
          id: "support",
          title: "Support",
          href: "/help",
          icon: "support",
        },
        {
          id: "refunds",
          title: "Refunds",
          href: "/resolution?type=refund",
          icon: "returns",
        },
        {
          id: "disputes",
          title: "Disputes",
          href: "/resolution?type=dispute",
          icon: "returns",
        },
      ],
    },
  ];
}
