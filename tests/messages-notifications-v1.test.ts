import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Messages + Notifications → Inbox Hub Sprint 1", () => {
  it("serves unified inbox instead of legacy list pages", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const messagesRoute = readSource("app/messages/page.tsx");
    const notificationsRoute = readSource("app/notifications/page.tsx");
    const index = readSource("styles/rovexo/index.css");

    expect(inbox).toContain("data-inbox-hub=");
    expect(inbox).toContain("Messages");
    expect(inbox).toContain("Notifications");
    expect(messagesRoute).toContain("redirect");
    expect(notificationsRoute).toContain("redirect");
    expect(index).toContain("./inbox-hub-v1.css");
    expect(index).toContain("./messages-v1.css");
    expect(index).toContain("./notifications-v1.css");
  });

  it("uses ConversationHub as the only live chat surface", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");

    expect(hub).toContain("data-conversation-hub");
    expect(hub).toContain("useChatRealtime");
    expect(hub).toContain("TransactionHubBottomActions");
    expect(css).toContain("--conv-composer-h: 52px");
  });

  it("renders notifications inside Inbox Hub", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const css = readSource("styles/rovexo/notifications-v1.css");

    expect(inbox).toContain("useRealtimeNotifications");
    expect(inbox).toContain("Mark all");
    expect(css).toContain(".notif-v1");
  });

  it("uses shared ROVEXO top bar with purple accent tokens", () => {
    const topbar = readSource("components/header/RvxTopBar.tsx");
    const css = readSource("styles/rovexo/messages-v1.css");

    expect(topbar).toContain("rvx-topbar__mark");
    expect(css).toContain("var(--ds-color-primary)");
    expect(css).not.toContain("#6F3FF5");
  });
});
