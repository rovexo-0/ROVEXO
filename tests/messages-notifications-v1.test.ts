import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Messages + Notifications canonical UI v1.0", () => {
  it("locks messages inbox v1 markers", () => {
    const inbox = readSource("features/messages/components/MessagesInboxV1.tsx");
    const route = readSource("app/messages/page.tsx");
    const css = readSource("styles/rovexo/messages-v1.css");
    const index = readSource("styles/rovexo/index.css");

    expect(route).toContain("MessagesInboxV1");
    expect(route).not.toContain("MessagesEngineHub");
    expect(route).toContain('dynamic = "force-dynamic"');
    expect(route).not.toContain("fetchConversations");
    expect(inbox).toContain('data-messages-version="v1.0"');
    expect(inbox).toContain("RvxTopBar");
    expect(inbox).toContain('className="msg-v1__title"');
    expect(inbox).toContain("msg-row");
    expect(css).toContain(".msg-v1");
    expect(css).toContain(".msg-row__badge");
    expect(css).toContain(".chat-v1");
    expect(css).toContain(".chat-bubble--out");
    expect(index).toContain("./messages-v1.css");
  });

  it("locks chat page v1 markers", () => {
    const chat = readSource("features/messages/components/ChatPage.tsx");
    const route = readSource("app/messages/[id]/page.tsx");

    expect(route).toContain("ChatPage");
    expect(route).not.toContain("MessagesEngineConversationPanel");
    expect(chat).toContain('data-messages-version="v1.0"');
    expect(chat).toContain("chat-v1__product");
    expect(chat).toContain("chat-v1__composer");
    expect(chat).toContain("Type a message...");
    expect(chat).toContain("useChatRealtime");
    expect(chat).toContain("/api/messages/");
  });

  it("locks notifications inbox v1 markers", () => {
    const inbox = readSource("features/notifications/components/NotificationsInboxV1.tsx");
    const route = readSource("app/notifications/page.tsx");
    const css = readSource("styles/rovexo/notifications-v1.css");
    const index = readSource("styles/rovexo/index.css");

    expect(route).toContain("NotificationsInboxV1");
    expect(route).not.toContain("NotificationsEngineHub");
    expect(route).not.toContain("fetchNotifications");
    expect(inbox).toContain('data-notifications-version="v1.0"');
    expect(inbox).toContain("Mark all as read");
    expect(inbox).toContain("notif-row");
    expect(inbox).toContain("markAllRead: true");
    expect(inbox).toContain("useRealtimeNotifications");
    expect(inbox).toContain('fetch("/api/notifications"');
    expect(css).toContain(".notif-v1");
    expect(css).toContain(".notif-row__dot");
    expect(index).toContain("./notifications-v1.css");
  });

  it("uses shared ROVEXO top bar with purple accent tokens", () => {
    const topbar = readSource("components/header/RvxTopBar.tsx");
    const css = readSource("styles/rovexo/messages-v1.css");

    expect(topbar).toContain("rvx-topbar__mark");
    expect(css).toContain("var(--ds-color-primary)");
    expect(css).not.toContain("#6F3FF5");
  });
});
