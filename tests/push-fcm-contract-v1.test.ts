import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FCM_HTTP_V1_PROJECT_ID,
  getFcmCredentialStatus,
  isFcmHttpV1Configured,
  isStaleFcmErrorCode,
} from "@/lib/push/fcm-http-v1";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("FCM backend contract", () => {
  it("does not create /api/native routes", () => {
    expect(read("app/api/push/register/route.ts")).not.toContain("/api/native");
    expect(read("lib/push/fcm-http-v1.ts")).not.toContain("/api/native");
    expect(read("lib/push/service.ts")).not.toContain("/api/native");
  });

  it("keeps Web Push subscribe on VAPID keys only", () => {
    const subscribe = read("app/api/push/subscribe/route.ts");
    expect(subscribe).toContain("push_subscriptions");
    expect(subscribe).toContain("p256dh");
    expect(subscribe).not.toContain("push_device_tokens");
    expect(subscribe).not.toContain("firebase-admin");
  });

  it("stores FCM tokens in the separate table", () => {
    const migration = read("supabase/migrations/20260920120000_push_device_tokens_fcm_v1.sql");
    expect(migration).toContain("create table if not exists public.push_device_tokens");
    expect(migration).not.toContain("alter table public.push_subscriptions");
    expect(migration).toContain("revoke all on table public.push_device_tokens from anon, authenticated");
  });

  it("uses Bearer-capable requireApiAuth(request)", () => {
    const route = read("app/api/push/register/route.ts");
    expect(route).toContain("requireApiAuth(request)");
    expect(route).not.toMatch(/\brequireApiAuth\(\)/);
    expect(route).toContain('user_id: auth.user.id');
    expect(route).not.toContain("body.userId");
  });

  it("does not use legacy FCM server keys or Play/browser credentials", () => {
    const adapter = read("lib/push/fcm-http-v1.ts");
    expect(adapter).not.toContain("FCM_SERVER_KEY");
    expect(adapter).not.toContain("fcm.googleapis.com/fcm/send");
    expect(adapter).not.toContain("google-services.json");
    expect(adapter).toContain("FIREBASE_SERVICE_ACCOUNT_JSON");
    expect(adapter).toContain("firebase-admin");
    expect(FCM_HTTP_V1_PROJECT_ID).toBe("rovexo-production");
  });

  it("attaches FCM beside the canonical sendPushNotification path", () => {
    const service = read("lib/push/service.ts");
    expect(service).toContain("deliverFcmDeviceTokens");
    expect(service).toContain("push_subscriptions");
    expect(service).toContain("webpush.sendNotification");
    const deliver = read("lib/notifications/deliver.ts");
    expect(deliver).toContain("sendPushNotification");
    expect(read("lib/notifications/create.ts")).toContain("from(\"notifications\")");
    expect(read("lib/notifications/events.ts")).toContain("createNotification");
    expect(read("lib/notifications/events.ts")).toContain("deliverNotificationChannels");
  });

  it("reports missing server credentials without inventing one", () => {
    expect(isFcmHttpV1Configured()).toBe(false);
    expect(getFcmCredentialStatus()).toBe("not_configured");
  });

  it("treats only unregistered FCM codes as stale", () => {
    expect(isStaleFcmErrorCode("UNREGISTERED")).toBe(true);
    expect(isStaleFcmErrorCode("messaging/registration-token-not-registered")).toBe(true);
    expect(isStaleFcmErrorCode("UNAVAILABLE")).toBe(false);
    expect(isStaleFcmErrorCode("INTERNAL")).toBe(false);
  });
});
