import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendPushNotification, type PushPayload } from "@/lib/push/service";
import type { FcmTransportResult } from "@/lib/push/fcm-http-v1";
import { fingerprintFcmToken } from "@/lib/push/fcm-http-v1";
import { createNotification } from "@/lib/notifications/create";
import { deliverNotificationChannels } from "@/lib/notifications/deliver";

const webPushSend = vi.fn();
const quietHoursMock = vi.hoisted(() => ({ force: false }));
const adminState = vi.hoisted(() => ({
  settings: {
    push_enabled: true,
    browser_push: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    sound: true,
    vibration: true,
  } as Record<string, unknown>,
  subscriptions: [] as Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    platform: string;
  }>,
  tokens: [] as Array<{ id: string; token: string; provider: string; platform: string }>,
  logs: [] as Array<Record<string, unknown>>,
  deletedTokenIds: [] as string[],
  deletedSubscriptionIds: [] as string[],
  notificationInserts: 0,
}));

vi.mock("@/lib/notifications/quiet-hours", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/notifications/quiet-hours")>();
  return {
    isWithinQuietHours: (input: { enabled: boolean; start: string; end: string }) => {
      if (quietHoursMock.force) return Boolean(input.enabled);
      return actual.isWithinQuietHours(input);
    },
  };
});

vi.mock("@/lib/push/vapid", async () => {
  const actual = await vi.importActual<typeof import("@/lib/push/vapid")>("@/lib/push/vapid");
  return {
    ...actual,
    isPushConfigured: () => true,
    configureWebPush: () => true,
    webpush: {
      sendNotification: (...args: unknown[]) => webPushSend(...args),
    },
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "notification_settings") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: adminState.settings, error: null }),
                };
              },
            };
          },
        };
      }
      if (table === "push_subscriptions") {
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({ data: adminState.subscriptions, error: null });
              },
            };
          },
          delete() {
            return {
              eq(_column: string, id: string) {
                adminState.deletedSubscriptionIds.push(id);
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      if (table === "push_device_tokens") {
        const filters: Record<string, string> = {};
        return {
          select() {
            return {
              eq(column: string, value: string) {
                filters[column] = value;
                const chain = {
                  eq(nextColumn: string, nextValue: string) {
                    filters[nextColumn] = nextValue;
                    return chain;
                  },
                  then(
                    resolve: (value: { data: unknown; error: null }) => unknown,
                    reject: (reason: unknown) => unknown,
                  ) {
                    const rows = adminState.tokens.filter((row) => {
                      if (filters.user_id && row !== undefined && filters.user_id) {
                        /* user filter applied by caller contract */
                      }
                      if (filters.provider && row.provider !== filters.provider) return false;
                      if (filters.platform && row.platform !== filters.platform) return false;
                      return true;
                    });
                    return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
                  },
                };
                return chain;
              },
            };
          },
          delete() {
            return {
              eq(_column: string, id: string) {
                adminState.deletedTokenIds.push(id);
                adminState.tokens = adminState.tokens.filter((row) => row.id !== id);
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      if (table === "notification_delivery_log") {
        return {
          async insert(row: Record<string, unknown>) {
            adminState.logs.push(row);
            return { error: null };
          },
        };
      }
      if (table === "notifications") {
        return {
          insert() {
            adminState.notificationInserts += 1;
            return {
              select() {
                return {
                  single: async () => ({ data: { id: "n-fcm-1" }, error: null }),
                };
              },
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

const USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const FCM_TOKEN = "fcm-live-token-should-never-be-logged";
const WEB_ENDPOINT = "https://fcm.googleapis.com/wp/example";

const payload: PushPayload = {
  title: "New message",
  body: "Hello from ROVEXO",
  href: "/inbox/conversation/abc",
  notificationId: "n-fcm-1",
  eventType: "message",
};

describe("FCM delivery adapter", () => {
  beforeEach(() => {
    webPushSend.mockReset();
    webPushSend.mockResolvedValue({ statusCode: 201 });
    adminState.settings = {
      push_enabled: true,
      browser_push: true,
      quiet_hours_enabled: false,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
      sound: true,
      vibration: true,
    };
    adminState.subscriptions = [];
    adminState.tokens = [];
    adminState.logs = [];
    adminState.deletedTokenIds = [];
    adminState.deletedSubscriptionIds = [];
    adminState.notificationInserts = 0;
    quietHoursMock.force = false;
  });

  it("keeps the existing Web Push path when only VAPID subscriptions exist", async () => {
    adminState.subscriptions = [
      {
        id: "sub-1",
        endpoint: WEB_ENDPOINT,
        p256dh: "p256",
        auth: "auth",
        platform: "web",
      },
    ];
    const sendFcm = vi.fn(async () => ({ ok: true } satisfies FcmTransportResult));
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(webPushSend).toHaveBeenCalledTimes(1);
    expect(sendFcm).not.toHaveBeenCalled();
    expect(result.sent).toBe(1);
  });

  it("selects only provider=fcm platform=android tokens", async () => {
    adminState.tokens = [
      { id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" },
      { id: "t-bad", token: "ignore-me", provider: "apns", platform: "ios" },
    ];
    const sendFcm = vi.fn(async () => ({ ok: true } satisfies FcmTransportResult));
    await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(sendFcm).toHaveBeenCalledTimes(1);
    expect(sendFcm.mock.calls[0]?.[0]?.token).toBe(FCM_TOKEN);
  });

  it("sends to multiple FCM devices", async () => {
    adminState.tokens = [
      { id: "t1", token: `${FCM_TOKEN}-1`, provider: "fcm", platform: "android" },
      { id: "t2", token: `${FCM_TOKEN}-2`, provider: "fcm", platform: "android" },
    ];
    const sendFcm = vi.fn(async () => ({ ok: true } satisfies FcmTransportResult));
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(sendFcm).toHaveBeenCalledTimes(2);
    expect(result.sent).toBe(2);
  });

  it("cleans up a stale FCM token only", async () => {
    adminState.subscriptions = [
      {
        id: "sub-1",
        endpoint: WEB_ENDPOINT,
        p256dh: "p256",
        auth: "auth",
        platform: "web",
      },
    ];
    adminState.tokens = [{ id: "t-stale", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const sendFcm = vi.fn(async () => ({
      ok: false,
      stale: true,
      reason: "UNREGISTERED",
    } satisfies FcmTransportResult));
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(adminState.deletedTokenIds).toEqual(["t-stale"]);
    expect(adminState.deletedSubscriptionIds).toEqual([]);
    expect(webPushSend).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });

  it("does not delete a token on a transient FCM error", async () => {
    adminState.tokens = [{ id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const sendFcm = vi.fn(async () => ({
      ok: false,
      stale: false,
      reason: "UNAVAILABLE",
    } satisfies FcmTransportResult));
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(adminState.deletedTokenIds).toEqual([]);
    expect(result.failed).toBe(1);
  });

  it("does not fail in-app persistence when FCM fails", async () => {
    adminState.tokens = [{ id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const sendFcm = vi.fn(async () => {
      throw new Error("FCM transport exploded");
    });
    const created = await createNotification({
      userId: USER_ID,
      type: "message",
      title: payload.title,
      subtitle: payload.body,
    });
    expect(created).toBe("n-fcm-1");
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(result.failed).toBe(1);
    expect(adminState.notificationInserts).toBe(1);
  });

  it("still delivers Web Push when FCM fails", async () => {
    adminState.subscriptions = [
      {
        id: "sub-1",
        endpoint: WEB_ENDPOINT,
        p256dh: "p256",
        auth: "auth",
        platform: "web",
      },
    ];
    adminState.tokens = [{ id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const sendFcm = vi.fn(async () => ({
      ok: false,
      stale: false,
      reason: "UNAVAILABLE",
    } satisfies FcmTransportResult));
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(webPushSend).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });

  it("respects push_enabled for both transports", async () => {
    adminState.settings.push_enabled = false;
    adminState.subscriptions = [
      {
        id: "sub-1",
        endpoint: WEB_ENDPOINT,
        p256dh: "p256",
        auth: "auth",
        platform: "web",
      },
    ];
    adminState.tokens = [{ id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const sendFcm = vi.fn(async () => ({ ok: true } satisfies FcmTransportResult));
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(webPushSend).not.toHaveBeenCalled();
    expect(sendFcm).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
  });

  it("respects quiet hours for both transports", async () => {
    quietHoursMock.force = true;
    adminState.settings.quiet_hours_enabled = true;
    adminState.settings.quiet_hours_start = "22:00";
    adminState.settings.quiet_hours_end = "07:00";
    adminState.tokens = [{ id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const sendFcm = vi.fn(async () => ({ ok: true } satisfies FcmTransportResult));
    const result = await sendPushNotification(USER_ID, payload, { sendFcm });
    expect(sendFcm).not.toHaveBeenCalled();
    expect(result.skipped).toBe(1);
  });

  it("creates one in-app notification before channel delivery", async () => {
    adminState.tokens = [{ id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const created = await createNotification({
      userId: USER_ID,
      type: "message",
      title: payload.title,
      subtitle: payload.body,
    });
    expect(created).toBe("n-fcm-1");
    expect(adminState.notificationInserts).toBe(1);
    await deliverNotificationChannels({
      userId: USER_ID,
      notificationId: created ?? "n-fcm-1",
      type: "message",
      eventType: "message",
      title: payload.title,
      subtitle: payload.body,
      skipPush: true,
      skipEmail: true,
    });
    expect(adminState.notificationInserts).toBe(1);
    expect(adminState.logs.some((row) => row.channel === "in_app")).toBe(true);
  });

  it("never logs the raw FCM token", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    adminState.tokens = [{ id: "t1", token: FCM_TOKEN, provider: "fcm", platform: "android" }];
    const sendFcm = vi.fn(async () => ({ ok: true } satisfies FcmTransportResult));
    await sendPushNotification(USER_ID, payload, { sendFcm });
    const serialized = JSON.stringify({ logs: adminState.logs, console: info.mock.calls });
    expect(serialized).not.toContain(FCM_TOKEN);
    expect(serialized).toContain(fingerprintFcmToken(FCM_TOKEN));
    info.mockRestore();
  });
});
