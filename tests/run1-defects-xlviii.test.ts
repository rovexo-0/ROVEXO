/**
 * RUN #1 DEFECT tests — Rating Engine + Inbox badge + image enhance + Hub SSOT links.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getMessageHref, getOrderHubTrackHref } from "@/lib/orders/status";

const root = process.cwd();

describe("RUN #1 DEFECT #001 — Rating Engine", () => {
  it("migration upserts seller_profiles and refreshes product rating", () => {
    const path = join(root, "supabase/migrations/20260725180000_rating_engine_refresh_upsert_v1.sql");
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, "utf8");
    expect(sql).toContain("refresh_product_rating");
    expect(sql).toContain("on conflict (id) do update");
    expect(sql).toContain("insert into public.seller_profiles");
    expect(sql).toContain("update public.products");
  });
});

describe("RUN #1 DEFECT #002/#003 — Hub SSOT links", () => {
  it("Order Details messaging deep-links to Inbox Hub", () => {
    const href = getMessageHref("order-123", "buyer");
    expect(href.startsWith("/inbox")).toBe(true);
    expect(href).not.toContain("/messages?");
  });

  it("Track deep-links to Inbox Hub with tracking focus", () => {
    const href = getOrderHubTrackHref("order-123");
    expect(href).toContain("/inbox?order=");
    expect(href).toContain("focus=tracking");
  });
});

describe("RUN #1 DEFECT #005 — Listing image enhance", () => {
  it("enhance module exists and is wired into listings upload", () => {
    expect(existsSync(join(root, "lib/media/enhance-listing-image.ts"))).toBe(true);
    const upload = readFileSync(join(root, "app/api/listings/upload/route.ts"), "utf8");
    expect(upload).toContain("enhanceListingImage");
  });
});

describe("RUN #1 DEFECT #007 — Inbox badge realtime", () => {
  it("conversation unread realtime helper exists", () => {
    expect(existsSync(join(root, "lib/inbox/conversation-unread-realtime.ts"))).toBe(true);
  });

  it("RealtimeNotificationProvider subscribes to conversation unread", () => {
    const src = readFileSync(
      join(root, "features/notifications/components/RealtimeNotificationProvider.tsx"),
      "utf8",
    );
    expect(src).toContain("subscribeToUserConversationUnread");
    expect(src).toContain("/api/inbox/badge");
    expect(src).toContain("includeTray");
  });
});

describe("RUN #1 DEFECT #004 — Badge performance path", () => {
  it("inbox badge API exists as lightweight SSOT and excludes archived", () => {
    const route = readFileSync(join(root, "app/api/inbox/badge/route.ts"), "utf8");
    expect(route).toContain("buyer_archived");
    expect(route).toContain("seller_archived");
    expect(route).toContain("inboxBadge");
  });
});

describe("RUN #1 DEFECT #006 — Full Width padding lock", () => {
  it("Design Decision #001: Internal 16px · Homepage content 16px · header 24px (9px still blocked)", () => {
    const contract = readFileSync(
      join(root, "lib/master-engine/master-full-width-contract-v1.ts"),
      "utf8",
    );
    expect(contract).toContain("paddingLeftPx: INTERNAL_PAD_X_PX");
    expect(contract).toContain("paddingRightPx: INTERNAL_PAD_X_PX");
    expect(contract).toContain("homepagePaddingLeftPx: HOMEPAGE_PAD_X_PX");
    const decision = readFileSync(
      join(root, "lib/design-system/design-decision-001-internal-ui-v1.1.ts"),
      "utf8",
    );
    expect(decision).toContain("INTERNAL_PAD_X_PX = 16");
    expect(decision).toContain("HOMEPAGE_CONTENT_PAD_X_PX = 16");
    expect(decision).toContain("HOMEPAGE_HEADER_PAD_X_PX = 24");
    expect(decision).not.toContain("INTERNAL_PAD_X_PX = 9");
  });
});
