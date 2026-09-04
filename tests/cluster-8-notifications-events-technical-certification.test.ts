import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1 } from "@/lib/notifications/cluster-8-notifications-events-scope-lock-v1";

const ROOT = process.cwd();
const ALLOWED_CREATE_OR_DISPATCH = new Set([
  "lib/notifications/events.ts",
  "lib/notifications/dispatch.ts",
  "lib/notifications/create.ts",
]);

const PRODUCER_PATH_MARKERS = [
  "lib/orders/notifications.ts",
  "lib/messages/store.ts",
  "lib/trust/notifications.ts",
  "lib/super-admin/notifications.ts",
  "lib/reviews/store.ts",
  "lib/follow-notifications/store.ts",
  "lib/transaction-hub/seller-wallet-notifications.ts",
  "app/api/wallet/withdraw/route.ts",
  "app/api/offers/route.ts",
  "app/api/offers/[id]/route.ts",
  "lib/moderation/notifications.ts",
  "lib/inventory/notifications.ts",
  "lib/promotions/notifications.ts",
  "lib/seller-performance/notifications.ts",
  "lib/launch/saved-search-notifications.ts",
  "lib/resolution-engine/notifications.ts",
  "lib/seller/migration/notifications.ts",
  "lib/saved/store.ts",
];

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (
      entry === "node_modules" ||
      entry === ".next" ||
      entry === "dist" ||
      entry === "coverage" ||
      entry === "test-results" ||
      entry === ".local" ||
      entry === ".local-chromium-deps" ||
      entry === ".local-chromium-libs" ||
      entry === ".local-webkit-libs" ||
      entry === ".git" ||
      entry === ".pnpm-store" ||
      entry === ".worktrees"
    ) {
      continue;
    }
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, out);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Cluster 8 Notifications & Events Technical Certification", () => {
  const lock = CLUSTER_8_NOTIFICATIONS_EVENTS_SCOPE_LOCK_V1;

  it("marks Owner Visual QA PASS and Production Freeze applied", () => {
    expect(lock.scopeLocked).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    expect(lock.ownerVisualQa).toBe("PASS");
    expect(lock.freezeApplied).toBe(true);
    expect(lock.productionReady).toBe(true);
    expect(lock.productionStatus).toBe("CERTIFIED");
    expect(lock.producers.migrationTargetsBeforeTechnicalCertification).toEqual([]);
    expect(lock.producers.canonical).toEqual(
      expect.arrayContaining([
        "Orders",
        "Shipping",
        "Wallet",
        "Offers",
        "Messages",
        "Reviews",
        "Verification / Trust",
        "Marketplace Follow",
        "Admin broadcasts",
      ]),
    );
  });

  it("keeps createNotification / dispatchNotification imports only inside authority modules", () => {
    const offenders: string[] = [];
    for (const file of walkTsFiles(ROOT)) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      if (ALLOWED_CREATE_OR_DISPATCH.has(rel)) continue;
      if (rel.startsWith("tests/")) continue;
      const src = readFileSync(file, "utf8");
      if (
        /from\s+["']@\/lib\/notifications\/create["']/.test(src) ||
        /from\s+["']@\/lib\/notifications\/dispatch["']/.test(src)
      ) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("requires required producers to call emitSmartNotification", () => {
    for (const rel of PRODUCER_PATH_MARKERS) {
      const src = read(rel);
      expect(src, rel).toMatch(/emitSmartNotification/);
      expect(src, rel).not.toMatch(/from\s+["']@\/lib\/notifications\/create["']/);
      expect(src, rel).not.toMatch(/from\s+["']@\/lib\/notifications\/dispatch["']/);
    }
  });

  it("routes push + email through deliverNotificationChannels from emitSmart", () => {
    const events = read("lib/notifications/events.ts");
    expect(events).toContain("deliverNotificationChannels");
    expect(events).toContain("email: input.email");
    expect(events).toContain("notification_preferences");
    expect(events).toContain("idempotencyKey");

    const deliver = read("lib/notifications/deliver.ts");
    expect(deliver).toContain("sendPushNotification");
    expect(deliver).toContain("queueEmail");
    expect(deliver).toContain("export async function deliverNotificationChannels");
  });

  it("keeps order notification producers free of direct queueEmail", () => {
    const orders = read("lib/orders/notifications.ts");
    expect(orders).not.toMatch(/queueEmail/);
    expect(orders).toContain("emitSmartNotification");
    expect(orders).toContain("email:");
  });

  it("defers v1.1 features and does not enable Spring 2", () => {
    expect(lock.deferredToV1_1).toContain("Notification Delete UI");
    expect(lock.deferredToV1_1).toContain("Authentication notifications");
    expect(lock.deferredToV1_1).toContain("Spring 2 Transaction Hub events");
    const spring2 = read("lib/inbox/transaction-hub-spring-2-v1.ts");
    expect(spring2).toMatch(/WAITING|LOCKED|WAITING FOR IMPLEMENTATION/i);
  });
});
