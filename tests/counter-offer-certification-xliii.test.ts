import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  CERTIFICATION_TARGETS,
  SUPREME_BLOOD_LAW_XLIII_COUNTER_OFFER_CERTIFICATION_V1,
  certifyCounterOfferXliii,
  assertCounterOfferCertificationOrBlock,
  assertCounterOfferProductionReleaseOrBlock,
} from "@/lib/supreme-blood-law-xliii-counter-offer-certification-v1";
import {
  COUNTER_OFFER_ERROR_COPY,
  encodeCounterOfferMessageMeta,
  mapOfferStatusToCounterError,
  parseCounterOfferMessageMeta,
  resolveOfferFromRole,
} from "@/lib/offers/counter-offer-engine-v1";
import { mapOfferDbStatus } from "@/lib/inbox/conversation-view";

function readTarget(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Absolute Blood Law XLIII — Counter Offer Certification", () => {
  it("locks Counter Offer certification contract", () => {
    const law = SUPREME_BLOOD_LAW_XLIII_COUNTER_OFFER_CERTIFICATION_V1;
    expect(law.bloodLaw).toBe("XLIII");
    expect(law.enginePath).toBe(CERTIFICATION_TARGETS.counterOfferEngine);
    expect(law.hubPath).toBe(CERTIFICATION_TARGETS.conversationHub);
    expect(law.forbiddenGenericErrors).toContain("Unable to counter offer.");
    expect(law.explicitErrorCodes).toContain("OFFER_ALREADY_COUNTERED");
    expect(law.explicitErrorCodes).toContain("OFFER_VERSION_MISMATCH");
  });

  it("exposes one canonical CERTIFICATION_TARGETS object with valid paths", () => {
    const targets = Object.values(CERTIFICATION_TARGETS);
    expect(new Set(targets).size).toBe(targets.length);
    for (const relativePath of targets) {
      expect(existsSync(path.join(process.cwd(), relativePath)), relativePath).toBe(true);
    }
    expect(CERTIFICATION_TARGETS.conversationHub).toBe(
      "features/inbox/components/ConversationHub.tsx",
    );
    expect(CERTIFICATION_TARGETS.inboxPage).toBe("features/inbox/components/InboxPage.tsx");
    expect(CERTIFICATION_TARGETS.notificationProvider).toBe(
      "features/notifications/components/RealtimeNotificationProvider.tsx",
    );
    expect(CERTIFICATION_TARGETS).not.toHaveProperty("badgeProvider");
  });

  it("maps statuses and message meta deterministically", () => {
    expect(mapOfferDbStatus("cancelled")).toBe("countered");
    expect(mapOfferDbStatus("pending")).toBe("open");
    expect(mapOfferStatusToCounterError("accepted")).toBe("OFFER_ALREADY_ACCEPTED");
    expect(COUNTER_OFFER_ERROR_COPY.OFFER_EXPIRED.message).toBe("Offer expired.");
    expect(COUNTER_OFFER_ERROR_COPY.DATABASE_UPDATE_FAILED.message).toBe(
      "Database update failed.",
    );

    const meta = encodeCounterOfferMessageMeta(
      "seller",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "note",
    );
    const parsed = parseCounterOfferMessageMeta(meta);
    expect(parsed.fromRole).toBe("seller");
    expect(parsed.parentOfferId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(parsed.userMessage).toBe("note");
    expect(
      resolveOfferFromRole({
        buyerId: "buyer-1",
        message: meta,
      }),
    ).toBe("seller");
  });

  it("API and Hub enforce fail-closed Counter Offer rules", () => {
    const api = readTarget(CERTIFICATION_TARGETS.offersApi);
    const hub = readTarget(CERTIFICATION_TARGETS.conversationHub);
    const engine = readTarget(CERTIFICATION_TARGETS.counterOfferEngine);

    expect(api).not.toContain("Unable to counter offer.");
    expect(api).toContain("executeCounterOffer");
    expect(api).toContain("canAccept");
    expect(api).toContain("focus=counter");
    expect(hub).toContain('expectedStatus: "pending"');
    expect(hub).toContain("Counter Sent · Waiting for Buyer");
    expect(hub).toContain('data-blood-law="XLIII"');
    expect(hub).toContain("payload.code");
    expect(hub).toContain("reloadRelated");
    expect(engine).toContain("createAdminClient");
    expect(engine).toContain("Restore parent");
  });

  it("certifies ConversationHub → InboxPage → RealtimeNotificationProvider inbox sync", () => {
    const hub = readTarget(CERTIFICATION_TARGETS.conversationHub);
    const inboxPage = readTarget(CERTIFICATION_TARGETS.inboxPage);
    const notificationProvider = readTarget(CERTIFICATION_TARGETS.notificationProvider);

    expect(hub).toContain('new CustomEvent("rovexo:inbox-sync"');
    expect(inboxPage).toContain('addEventListener("rovexo:inbox-sync"');
    expect(inboxPage).toContain('removeEventListener("rovexo:inbox-sync"');
    expect(notificationProvider).toContain('addEventListener("rovexo:inbox-sync"');
    expect(notificationProvider).toContain('removeEventListener("rovexo:inbox-sync"');
  });

  it("keeps Inbox Event Engine singularity into XLIII", () => {
    const law = SUPREME_BLOOD_LAW_XLIII_COUNTER_OFFER_CERTIFICATION_V1;
    expect(law.inboxEventEngine.rpc).toBe("sync_conversation_open_v1");
    expect(law.inboxEventEngine.clientBroadcast).toBe("rovexo:inbox-sync");
    expect(law.inboxEventEngine.path).toBe(CERTIFICATION_TARGETS.inboxEventEngine);
    const engine = readTarget(CERTIFICATION_TARGETS.inboxEventEngine);
    const messagesApi = readTarget(CERTIFICATION_TARGETS.messagesApi);
    const barrel = readFileSync(path.join(process.cwd(), "lib/inbox/index.ts"), "utf8");
    expect(engine).toContain("syncConversationOpen");
    expect(engine).toContain('import "server-only"');
    expect(engine).not.toContain("@/lib/supabase/server");
    expect(engine).not.toContain('.eq("type", "message")');
    expect(messagesApi).toContain("syncConversationOpen");
    expect(barrel).not.toMatch(/export\s+\*\s+from\s+["'][^"']*inbox-event-engine/);
  });

  it("passes XLIII certification gate and wires instrumentation", () => {
    const report = certifyCounterOfferXliii();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.certified).toBe(true);
    expect(report.productionReady).toBe(false);
    expect(report.gates.some((g) => g.id === "hub-inbox-sync-dispatch" && g.pass)).toBe(true);
    expect(report.gates.some((g) => g.id === "inbox-page-listener-register" && g.pass)).toBe(true);
    expect(report.gates.some((g) => g.id === "inbox-page-listener-cleanup" && g.pass)).toBe(true);
    expect(
      report.gates.some((g) => g.id === "notification-provider-listener-register" && g.pass),
    ).toBe(true);
    expect(
      report.gates.some((g) => g.id === "notification-provider-listener-cleanup" && g.pass),
    ).toBe(true);
    expect(() => assertCounterOfferCertificationOrBlock()).not.toThrow();
    expect(() =>
      assertCounterOfferProductionReleaseOrBlock({ runtimeE2eEvidencePass: false }),
    ).toThrow(/runtime E2E/);

    const instrumentation = readTarget(CERTIFICATION_TARGETS.instrumentation);
    expect(instrumentation).toContain("assertCounterOfferCertificationOrBlock");
  });
});
