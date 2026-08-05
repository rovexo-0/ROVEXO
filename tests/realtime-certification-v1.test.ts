import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REALTIME_CERTIFICATION_CONTRACT,
  REALTIME_CERTIFICATION_ID,
  REALTIME_DOMAINS,
  REALTIME_MAX_LATENCY_MS,
  REALTIME_WORKFLOWS,
  assertRealtimeCertificationOrBlock,
  emptyRealtimeEvidence,
  evaluateRealtimeCertification,
} from "@/lib/realtime/realtime-certification-engine-v1";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Realtime Engine Certification v1.2 — SSOT lock", () => {
  it("locks Final Preview Blocker contract · no fake/optimistic/proxy pass", () => {
    expect(REALTIME_CERTIFICATION_ID).toBe("REALTIME_ENGINE_CERTIFICATION");
    expect(REALTIME_CERTIFICATION_CONTRACT.version).toBe("v1.2");
    expect(REALTIME_CERTIFICATION_CONTRACT.mandatoryBeforePreviewRelease).toBe(true);
    expect(REALTIME_CERTIFICATION_CONTRACT.forbidden).toContain("fake_pass");
    expect(REALTIME_CERTIFICATION_CONTRACT.forbidden).toContain("optimistic_pass");
    expect(REALTIME_CERTIFICATION_CONTRACT.forbidden).toContain("proxy_pass");
    expect(REALTIME_CERTIFICATION_CONTRACT.forbidden).toContain("preview");
    expect(REALTIME_MAX_LATENCY_MS).toBe(8000);
  });

  it("covers Owner realtime domains including dashboards", () => {
    for (const domain of [
      "messages",
      "notifications",
      "offers",
      "orders",
      "wallet",
      "follow",
      "search",
      "tracking",
      "reviews",
      "bundle",
      "seller_dashboard",
      "buyer_dashboard",
    ] as const) {
      expect(REALTIME_DOMAINS).toContain(domain);
      expect(REALTIME_WORKFLOWS.some((w) => w.domain === domain)).toBe(true);
    }
  });

  it("v1.2 requires live evidence for every workflow", () => {
    expect(REALTIME_WORKFLOWS.every((w) => w.liveRequired === true)).toBe(true);
  });

  it("Following feed must not poll — realtime transport required", () => {
    const feed = read("features/home/components/FollowingFeedSection.tsx");
    expect(feed).toContain("subscribeFollowingFeedRealtime");
    expect(feed).not.toMatch(/setInterval\s*\(/);
    expect(feed).not.toContain("45_000");
    expect(existsSync(join(process.cwd(), "lib/realtime/following-feed-realtime.ts"))).toBe(
      true,
    );
  });

  it("Orders · Wallet · Search wire live transports", () => {
    expect(read("features/orders/components/OrdersPage.tsx")).toContain("subscribeOrdersRealtime");
    expect(read("features/wallet/hooks/use-wallet-live.ts")).toContain("subscribeToWalletLiveStats");
    expect(read("lib/account-center/realtime.ts")).toContain("subscribeToWalletLiveStats");
    expect(read("lib/account-center/realtime.ts")).toContain("wallet-live-wallets");
    expect(read("lib/account-center/realtime.ts")).toContain("wallet_transactions");
    expect(read("features/wallet/components/WalletHubV1.tsx")).toContain("useWalletLive");
    expect(read("features/search/components/SearchResultsView.tsx")).toContain(
      "subscribeSearchListingsRealtime",
    );
  });

  it("Inbox Event Engine + dual UI sync remain singular", () => {
    expect(read("lib/inbox/inbox-event-engine-v1.ts")).toContain("syncConversationOpen");
    expect(read("features/inbox/components/ConversationHub.tsx")).toContain("rovexo:inbox-sync");
    expect(read("features/inbox/components/InboxPage.tsx")).toContain("rovexo:inbox-sync");
    expect(
      read("features/notifications/components/RealtimeNotificationProvider.tsx"),
    ).toContain("rovexo:inbox-sync");
  });

  it("empty evidence fails closed", () => {
    const empty = emptyRealtimeEvidence();
    const { pass } = evaluateRealtimeCertification(empty);
    expect(pass).toBe(false);
    expect(() => assertRealtimeCertificationOrBlock(empty)).toThrow(/BLOCKED/);
  });

  it("runner + e2e + evidence dir contract exist", () => {
    expect(existsSync(join(process.cwd(), "scripts/run-realtime-certification.mjs"))).toBe(true);
    expect(existsSync(join(process.cwd(), "e2e/realtime-certification.spec.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "e2e/helpers/realtime-certification.ts"))).toBe(true);
    expect(
      existsSync(join(process.cwd(), "e2e/helpers/realtime-certification-domains-v1.2.ts")),
    ).toBe(true);
  });
});
