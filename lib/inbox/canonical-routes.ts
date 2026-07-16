/** Canonical Inbox Hub routes — v1.0 FROZEN SSOT. */

export const INBOX_CANONICAL_VERSION = "v1.1-zoom-out" as const;

export const INBOX_ROUTES = {
  hub: "/inbox",
  messagesTab: "/inbox?tab=messages",
  notificationsTab: "/inbox?tab=notifications",
  conversation: (conversationId: string) =>
    `/inbox/conversation/${encodeURIComponent(conversationId)}`,
  search: "/inbox?search=1",
} as const;

export type InboxTab = "messages" | "notifications";

export function parseInboxTab(value: string | null | undefined): InboxTab {
  return value === "notifications" ? "notifications" : "messages";
}
