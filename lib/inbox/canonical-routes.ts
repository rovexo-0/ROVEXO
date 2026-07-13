/** Canonical Inbox Hub routes — Sprint 1 SSOT. */

export const INBOX_CANONICAL_VERSION = "v1.0-sprint-1" as const;

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
