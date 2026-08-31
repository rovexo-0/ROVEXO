import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP,
  LISTING_CARD_VIEWPORT_PREFETCH_CAP,
  resetViewportRoutePrefetchStateForTests,
} from "@/lib/navigation/viewport-route-prefetch-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("P0 Mobile Instant Interaction — viewport route prefetch", () => {
  beforeEach(() => {
    resetViewportRoutePrefetchStateForTests();
  });

  it("keeps strict caps for listing cards and inbox conversations", () => {
    expect(LISTING_CARD_VIEWPORT_PREFETCH_CAP).toBe(8);
    expect(INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP).toBe(4);
  });

  it("ListingCard keeps Link + prefetch={false} and selective viewport surfaces only", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("prefetch={false}");
    expect(card).toContain("useViewportRoutePrefetch");
    expect(card).toContain('"homepage"');
    expect(card).toContain('"store"');
    expect(card).toContain('"saved"');
    expect(card).not.toContain("LISTING_CARD_PREFETCH_SURFACES.has(\"search\")");
  });

  it("Inbox conversation rows use capped viewport prefetch (not all threads)", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const link = readSource("features/inbox/components/InboxConversationPrefetchLink.tsx");
    expect(inbox).toContain("InboxConversationPrefetchLink");
    expect(link).toContain("INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP");
    expect(link).toContain("prefetch={false}");
    expect(link).toContain("useViewportRoutePrefetch");
  });

  it("Account Balance points at /wallet; Settings at /account/settings", () => {
    const menu = readSource("lib/account-center/canonical-menu.ts");
    expect(menu).toContain('href: "/wallet"');
    expect(menu).toContain('title: "Balance"');
    expect(menu).toContain('href: "/account/settings"');
  });

  it("Bottom nav Phase A1 warms /wallet", () => {
    const nav = readSource("components/ui/BottomNavigation.tsx");
    expect(nav).toContain('"/wallet"');
    expect(nav).toContain("Phase A1");
  });

  it("listing loading.tsx remains for soft navigation shell", () => {
    const loading = readSource("app/(platform)/listing/[slug]/loading.tsx");
    expect(loading).toContain("ProductSkeleton");
    expect(loading).toContain("BetaAppShell");
  });
});
