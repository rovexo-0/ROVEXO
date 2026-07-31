import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  NOTIFICATION_ENGINE_SECTIONS,
  NOTIFICATION_SECURITY_CONTROLS,
  applyNotificationEnginePatch,
  createDefaultNotificationEngineState,
  engineToNotificationPreferences,
  parseNotificationEngineState,
} from "@/lib/notifications/notification-engine-v1";
import {
  COOKIE_PREFERENCE_CONTROLS,
  PRIVACY_ENGINE_SECTIONS,
  applyPrivacySwitchPatch,
  createDefaultCookiePreferences,
  createDefaultPrivacyEngineState,
  privacyEngineToLegacy,
} from "@/lib/privacy/privacy-engine-v1";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Notification & Privacy Engine v1.0", () => {
  it("ships complete notification section inventory", () => {
    const titles = NOTIFICATION_ENGINE_SECTIONS.map((s) => s.title);
    expect(titles).toEqual([
      "Orders",
      "Buying",
      "Selling",
      "Marketplace",
      "Wallet",
      "Payments",
      "Reviews",
      "Support",
      "Platform",
      "Delivery Channels",
      "Security",
    ]);
    expect(NOTIFICATION_SECURITY_CONTROLS).toHaveLength(8);
    expect(NOTIFICATION_SECURITY_CONTROLS.every((c) => c.locked)).toBe(true);

    const channels = NOTIFICATION_ENGINE_SECTIONS.find((s) => s.id === "channels");
    expect(channels?.controls.map((c) => c.label)).toEqual([
      "Push Notifications",
      "Email Notifications",
      "SMS Notifications",
      "WhatsApp Notifications",
      "Browser Notifications",
    ]);
    expect(channels?.controls.filter((c) => c.structureOnly).map((c) => c.id)).toEqual([
      "sms",
      "whatsapp",
    ]);
  });

  it("locks security preferences and derives Cluster 8 prefs", () => {
    const state = createDefaultNotificationEngineState();
    const prefs = engineToNotificationPreferences(state);
    expect(prefs.security).toBe(true);

    const patched = applyNotificationEnginePatch(state, {
      topicId: "orders.shipping",
      enabled: false,
    });
    expect(patched.topics["orders.shipping"]).toBe(false);
    expect(parseNotificationEngineState(patched).version).toBe("1.0");
  });

  it("ships complete privacy inventory without duplicate legal docs", () => {
    const titles = PRIVACY_ENGINE_SECTIONS.map((s) => s.title);
    expect(titles).toContain("Privacy Controls");
    expect(titles).toContain("Profile Visibility");
    expect(titles).toContain("Messaging Privacy");
    expect(titles).toContain("Marketplace Privacy");
    expect(titles).toContain("Marketing Preferences");
    expect(titles).toContain("Search & Discovery");
    expect(titles).toContain("Followers & Social");
    expect(titles).toContain("Followers & Social");
    expect(titles).not.toContain("Your Data");
    expect(titles).not.toContain("Cookie Preferences");
    expect(titles).not.toContain("Legal");
    expect(titles).not.toContain("Danger Zone");
    expect(COOKIE_PREFERENCE_CONTROLS.find((c) => c.id === "necessary")?.locked).toBe(true);
  });

  it("maps privacy engine to legacy columns", () => {
    let state = createDefaultPrivacyEngineState();
    state = applyPrivacySwitchPatch(state, "marketingEmails", true);
    state = applyPrivacySwitchPatch(state, "showOnlineStatus", false);
    state = applyPrivacySwitchPatch(state, "showLastSeen", false);
    const legacy = privacyEngineToLegacy(state);
    expect(legacy.marketingEmails).toBe(true);
    expect(legacy.showActivityStatus).toBe(false);
    expect(createDefaultCookiePreferences().necessary).toBe(true);
  });

  it("wires singular Settings surfaces and cookie page", () => {
    const notifications = readSource(
      "features/notifications/components/NotificationSettingsPage.tsx",
    );
    const privacy = readSource("features/account/components/AccountPrivacyPage.tsx");
    const cookies = readSource("features/account/components/CookiePreferencesPage.tsx");
    const prefsRoute = readSource("app/notifications/preferences/page.tsx");
    const migration = readSource(
      "supabase/migrations/20260730220000_notification_privacy_engine_v1.sql",
    );

    expect(notifications).toContain("NOTIFICATION_ENGINE_SECTIONS");
    expect(notifications).toContain('data-notification-engine="v1.0"');
    expect(privacy).toContain("PRIVACY_ENGINE_SECTIONS");
    expect(privacy).not.toContain("Open Legal Centre");
    expect(privacy).not.toContain("/account/privacy/cookies");
    expect(privacy).not.toContain("Your Data");
    expect(privacy).not.toContain("Danger Zone");
    expect(privacy).not.toContain("DeleteAccountFlow");
    expect(privacy).not.toContain("/legal/privacy-policy");
    expect(privacy).not.toContain("/legal/cookie-policy");
    expect(cookies).toContain("COOKIE_PREFERENCE_CONTROLS");
    expect(prefsRoute).toContain('redirect("/notifications/settings")');
    expect(migration).toContain("engine_v1");
    expect(migration).toContain("privacy_engine_v1");
    expect(migration).toContain("cookie_preferences_v1");
  });

  it("forces security always-on in emit + preferences API", () => {
    const events = readSource("lib/notifications/events.ts");
    const prefsApi = readSource("app/api/notifications/preferences/route.ts");
    expect(events).toContain('if (category === "security") return true');
    expect(prefsApi).toContain("security: true");
  });
});
