import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_VIII_V1,
  resolveBloodViiiProductPass,
  shouldOmitOfferFromChatTimeline,
} from "@/lib/supreme-blood-code-viii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_V_V1 } from "@/lib/supreme-blood-code-v-v1";
import { SUPREME_BLOOD_CODE_VII_V1 } from "@/lib/supreme-blood-code-vii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { buildConversationHubView } from "@/lib/inbox/conversation-view";
import type { Conversation } from "@/lib/messages/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function listTsxNames(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => entry.name);
}

const sampleConversation = {
  id: "conv-1",
  participant: {
    id: "u1",
    name: "Olimpia palade",
    role: "seller" as const,
    online: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  product: {
    id: "p1",
    slug: "pillow",
    title: "Lumbar Support Pillow",
    price: 6.5,
    condition: "Good",
    imageUrl: "/placeholder-product.svg",
    status: "published" as const,
    listingType: "fixed" as const,
    acceptOffers: true,
  },
  lastMessage: "Hi",
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  pinned: false,
  archived: false,
  muted: false,
  blocked: false,
  messages: [
    {
      id: "m1",
      senderRole: "buyer" as const,
      kind: "text" as const,
      content: "Hi.",
      sentAt: "2026-07-16T10:15:00.000Z",
      status: "read" as const,
      reactions: {},
    },
    {
      id: "m2",
      senderRole: "seller" as const,
      kind: "text" as const,
      content: "Hello.",
      sentAt: "2026-07-16T10:16:00.000Z",
      status: "read" as const,
      reactions: {},
    },
  ],
} as Conversation;

describe("ROVEXO Supreme Blood Code VIII — Conversation Hub Purification", () => {
  it("locks Priority 0 permanent freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_VIII_V1.codename).toBe("CONVERSATION_HUB_PURIFICATION");
    expect(SUPREME_BLOOD_CODE_VIII_V1.status).toBe("PERMANENT_FREEZE_APPROVED");
    expect(SUPREME_BLOOD_CODE_VIII_V1.priority0).toBe(true);
    expect(SUPREME_BLOOD_CODE_VIII_V1.unifiedTimelineIsOnlyOfferSurface).toBe(true);
    expect(SUPREME_BLOOD_CODE_VIII_V1.hideTricksForbidden).toContain("display:none");
  });

  it("keeps offer bubbles in the unified chat timeline; Offer Accepted system card is Status Card only", () => {
    expect(
      shouldOmitOfferFromChatTimeline({ kind: "offer", offerState: "accepted" }),
    ).toBe(false);
    expect(
      shouldOmitOfferFromChatTimeline({ kind: "offer", offerState: "open" }),
    ).toBe(false);

    const view = buildConversationHubView({
      conversation: sampleConversation,
      offers: [
        {
          id: "o1",
          amount: 4.5,
          currency: "GBP",
          state: "declined",
          fromRole: "buyer",
          createdAt: "2026-07-16T10:32:00.000Z",
        },
        {
          id: "o2",
          amount: 5,
          currency: "GBP",
          state: "accepted",
          fromRole: "buyer",
          createdAt: "2026-07-16T11:02:00.000Z",
        },
        {
          id: "o3",
          amount: 5.5,
          currency: "GBP",
          state: "open",
          fromRole: "buyer",
          createdAt: "2026-07-16T12:00:00.000Z",
        },
      ],
    });

    const offerItems = view.timeline.filter((item) => item.kind === "offer");
    expect(offerItems).toHaveLength(3);
    expect(
      view.timeline.some((item) => item.kind === "system" && item.event === "offer_accepted"),
    ).toBe(false);
    expect(SUPREME_BLOOD_CODE_VIII_V1.unifiedTimelineIsOnlyOfferSurface).toBe(true);
    expect(SUPREME_BLOOD_CODE_VIII_V1.noSeparateOfferHistory).toBe(true);
  });

  it("resolves Product PASS only when purification + Owner visual pass", () => {
    expect(
      resolveBloodViiiProductPass({
        searchBarRemoved: true,
        rovexoLogoRemoved: true,
        duplicatesRemoved: true,
        headerPass: true,
        chatPass: true,
        messageInputPass: true,
        ctaPass: true,
        responsivePass: true,
        whiteScreenPass: true,
        ownerVisualPass: true,
      }),
    ).toBe("PRODUCT_PASS_100");
    expect(
      resolveBloodViiiProductPass({
        searchBarRemoved: true,
        rovexoLogoRemoved: true,
        duplicatesRemoved: true,
        headerPass: true,
        chatPass: true,
        messageInputPass: true,
        ctaPass: true,
        responsivePass: true,
        whiteScreenPass: true,
        ownerVisualPass: false,
      }),
    ).toBe("PRODUCT_FAIL");
  });

  it("wires into Blood I/V/VII, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      conversationHubPurification: "lib/supreme-blood-code-viii-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_V_V1.childLaws).toMatchObject({
      conversationHubPurification: "lib/supreme-blood-code-viii-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_VII_V1.childLaws).toMatchObject({
      conversationHubPurification: "lib/supreme-blood-code-viii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeViii: "lib/supreme-blood-code-viii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeViii: "lib/supreme-blood-code-viii-v1.ts",
    });
  });

  it("ensures forbidden hub files do not exist and Hub is purified", () => {
    const inboxComponents = listTsxNames("features/inbox/components");
    for (const name of SUPREME_BLOOD_CODE_VIII_V1.forbiddenHubFiles) {
      expect(inboxComponents).not.toContain(name);
      expect(existsSync(join(process.cwd(), "features/inbox/components", name))).toBe(false);
    }

    const hub = readSource(SUPREME_BLOOD_CODE_VIII_V1.canonicalHub.component);
    const timeline = readSource(SUPREME_BLOOD_CODE_VIII_V1.canonicalHub.timelineSsot);
    const rule = readSource(".cursor/rules/supreme-blood-code-viii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_VIII_V1.md");

    expect(hub).toContain("data-blood-code-viii");
    expect(hub).toContain("data-hub-purified");
    expect(hub).toContain("shouldOmitOfferFromChatTimeline");
    expect(hub).not.toContain("conv-hub__system-brand");
    expect(hub).not.toMatch(/HeaderSearchBar|ConversationSearch|SearchBar/);
    expect(timeline).toContain("unified conversation timeline");
    /* Offer Accepted system card removed — Transaction Status Card is canonical (Recovery Sprint I). */
    expect(timeline).not.toMatch(/system-offer-accepted-\$\{/);
    expect(rule).toContain("alwaysApply: true");
    expect(doc).toContain("PERMANENT FREEZE APPROVED");
  });
});
