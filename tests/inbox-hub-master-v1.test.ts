import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INBOX_HUB_MASTER_BOTTOM_NAV,
  INBOX_HUB_MASTER_ENTRY,
  INBOX_HUB_MASTER_STATUS,
  INBOX_HUB_MASTER_TOKENS,
  inboxHubMasterSnapshot,
} from "@/lib/inbox/inbox-hub-master-v1";
import { INBOX_HUB_CANONICAL_FROZEN, INBOX_HUB_VISUAL_LOCK } from "@/lib/inbox/freeze";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Inbox Hub Master Implementation v1.0", () => {
  it("locks single entry + Profile/Full Width/Purple tokens", () => {
    const snap = inboxHubMasterSnapshot();
    expect(snap.status).toBe(INBOX_HUB_MASTER_STATUS);
    expect(snap.entry).toBe(INBOX_HUB_MASTER_ENTRY);
    expect(INBOX_HUB_CANONICAL_FROZEN).toBe(true);
    expect(INBOX_HUB_MASTER_TOKENS.headerPx).toBe(64);
    expect(INBOX_HUB_MASTER_TOKENS.paddingXPx).toBe(16);
    expect(INBOX_HUB_MASTER_TOKENS.primaryCtaHeightPx).toBe(56);
    expect(INBOX_HUB_MASTER_TOKENS.primaryCtaRadiusPx).toBe(16);
    expect(INBOX_HUB_MASTER_TOKENS.width).toBe("100%");
    expect(INBOX_HUB_MASTER_TOKENS.purpleGradient).toContain("#a855f7");
    expect(INBOX_HUB_VISUAL_LOCK.headerHeightPx).toBe(64);
    expect(INBOX_HUB_VISUAL_LOCK.pagePadXPx).toBe(16);
    expect(INBOX_HUB_VISUAL_LOCK.primaryCtaHeightPx).toBe(56);
    expect(INBOX_HUB_VISUAL_LOCK.purpleGradient).toContain("#9333ea");
  });

  it("shows bottom nav on hub; hides on conversations (composer is bottom chrome)", () => {
    expect(INBOX_HUB_MASTER_BOTTOM_NAV.hubShowsBottomNav).toBe(true);
    expect(INBOX_HUB_MASTER_BOTTOM_NAV.conversationHidesBottomNav).toBe(true);
    expect(INBOX_HUB_MASTER_BOTTOM_NAV.conversationShowsBottomNav).toBe(false);
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const conversation = readSource("features/inbox/components/ConversationHub.tsx");
    const convCss = readSource("styles/rovexo/conversation-hub-v1.css");
    expect(inbox).toMatch(/showBottomNav(?!\s*=\s*\{false\})/);
    expect(inbox).toContain('bottomNavTab="saved"');
    expect(inbox).toContain("data-inbox-master={INBOX_HUB_MASTER_DOM}");
    expect(conversation).toContain("showBottomNav={false}");
    expect(convCss).toContain("Composer is permanent bottom chrome");
  });

  it("ships purple gradient + Full Width + empty CTA 44 on Inbox Hub CSS", () => {
    const css = readSource("styles/rovexo/inbox-hub-v1.css");
    expect(css).toContain("--inbox-purple-gradient");
    expect(css).toContain("linear-gradient(135deg, #a855f7");
    expect(css).toContain("--inbox-btn-h: 56px");
    expect(css).toContain("--inbox-empty-cta-h: 44px");
    expect(css).toContain("--inbox-btn-radius: 16px");
    expect(css).toContain("min-height: calc(52px + env(safe-area-inset-top, 0px))");
    expect(css).toContain("grid-template-columns: 1fr 1fr");
    expect(css).toContain("width: 50%");
    expect(css).toContain("max-width: none");
    expect(css).toContain("width: 100%");
    expect(css).not.toContain("--inbox-pad-x: 16px");
    expect(css).not.toContain(".inbox-hub__notif-card");
    expect(css).not.toMatch(/max-width:\s*(320|360|390|420)px/);
    expect(INBOX_HUB_MASTER_TOKENS.maxWidth).toBe("none");
    expect(INBOX_HUB_MASTER_TOKENS.emptyCtaHeightPx).toBe(44);
    expect(INBOX_HUB_VISUAL_LOCK.emptyCtaHeightPx).toBe(44);
    expect(INBOX_HUB_VISUAL_LOCK.maxWidth).toBe("none");
  });

  it("keeps singular Messages/Notifications entry via redirects", () => {
    expect(readSource("app/messages/page.tsx")).toContain("redirect(");
    expect(readSource("app/notifications/page.tsx")).toContain("INBOX_ROUTES.notificationsTab");
    expect(readSource("lib/homepage/canonical-nav.ts")).toContain('href: "/inbox"');
  });

  it("removes orphan Messages/Notifications list CSS and parallel notification cards", () => {
    expect(() => readSource("styles/rovexo/messages-v1.css")).toThrow();
    expect(() => readSource("styles/rovexo/notifications-v1.css")).toThrow();
    expect(() =>
      readSource("features/notifications/components/NotificationCard.tsx"),
    ).toThrow();
    expect(() =>
      readSource("features/notifications/components/NotificationsEmptyState.tsx"),
    ).toThrow();
    expect(readSource("styles/rovexo/index.css")).toContain("./rvx-topbar-v1.css");
    expect(readSource("styles/rovexo/index.css")).toContain("./inbox-hub-v1.css");
  });
});
