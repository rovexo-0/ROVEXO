import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import type { UserProfile } from "@/lib/profile/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const stubProfile = {
  id: "u1",
  email: "demo@rovexo.co.uk",
  fullName: "Demo",
  username: "demo",
  role: "buyer",
} as UserProfile;

describe("P0.3 Mobile instant navigation diagnosis fixes", () => {
  it("Conversation route avoids heavy getProfile; uses cached getAuthContext only when needed", () => {
    const page = readSource("app/(platform)/inbox/conversation/[conversationId]/page.tsx");
    expect(page).not.toContain('from "@/lib/profile/data"');
    expect(page).not.toContain("getProfile()");
    expect(page).toContain("getAuthContext");
    expect(page).toContain("fetchConversationById");
  });

  it("Conversation hydrate parallelizes photo sign + presence", () => {
    const store = readSource("lib/messages/store.ts");
    expect(store).toContain("signPhotoMessageContents(conversation.messages)");
    expect(store).toContain("getPresence(conversation.participant.id)");
    expect(store).toMatch(/Promise\.all\(\[\s*signPhotoMessageContents/);
  });

  it("Wallet and Orders do not await self-heal before first paint data", () => {
    const wallet = readSource("app/(platform)/wallet/page.tsx");
    const orders = readSource("app/(platform)/orders/page.tsx");
    expect(wallet).toContain('void awaitCheckoutSessionSelfHeal("wallet")');
    expect(wallet).not.toMatch(/await awaitCheckoutSessionSelfHeal\("wallet"\)/);
    expect(orders).toContain('void awaitCheckoutSessionSelfHeal("orders")');
    expect(orders).not.toMatch(/await awaitCheckoutSessionSelfHeal\("orders"\)/);
  });

  it("Account Settings points at canonical /account/settings (no redirect hop)", () => {
    const href = buildAccountMenuSections(stubProfile)
      .flatMap((s) => s.items)
      .find((i) => i.id === "settings")?.href;
    expect(href).toBe("/account/settings");
  });

  it("Saved grid CSS is on server route and forces mobile 2 columns", () => {
    const route = readSource("app/(platform)/saved/page.tsx");
    const css = readSource("styles/rovexo/listing-grid-v1.css");
    const saved = readSource("features/account-module/components/SavedItemsV1.tsx");
    expect(route).toContain('import "@/styles/rovexo/listing-grid-v1.css"');
    expect(saved).toContain('data-saved-grid="mobile-2col"');
    expect(saved).toContain("rx-listing-grid");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr)) !important");
  });

  it("Account menu warms destinations and intent-prefetches rows", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    const row = readSource("src/components/canonical/CanonicalMenuRow.tsx");
    expect(menu).toContain("prefetchRouteOnIntent");
    expect(row).toContain("prefetchRouteOnIntent");
    expect(row).toContain("onPointerDown");
  });
});
