/**
 * Production PWA push path — SW must be ensure-registered (not ready-wait only).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isLocalPushHost } from "@/lib/push/push-capability-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("push production PWA / Home Screen path", () => {
  it("isLocalPushHost gates localhost only", () => {
    expect(isLocalPushHost("localhost")).toBe(true);
    expect(isLocalPushHost("127.0.0.1")).toBe(true);
    expect(isLocalPushHost("www.rovexo.co.uk")).toBe(false);
  });

  it("capability layer ensure-registers Production /sw.js before ready wait", () => {
    const cap = readSource("lib/push/push-capability-v1.ts");
    expect(cap).toContain("ensureProductionServiceWorkerRegistration");
    expect(cap).toContain('register("/sw.js"');
    expect(cap).toContain('scope: "/"');
    expect(cap).toContain("waitForServiceWorkerReady");
    expect(cap).toMatch(
      /waitForServiceWorkerReady[\s\S]*ensureProductionServiceWorkerRegistration/,
    );
    expect(cap).toContain("isLocalPushHost");
  });

  it("subscribe uses waitForServiceWorkerReady (ensure path) — no second push system", () => {
    const sub = readSource("lib/push/client-subscribe.ts");
    expect(sub).toContain("waitForServiceWorkerReady");
    expect(sub).toContain("/api/push/subscribe");
    expect(sub).toContain("getVapidPublicKey");
    expect(sub).not.toContain("new NotificationSystem");
    expect(sub).toContain("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  });

  it("PwaProvider registers Production SW with scope /", () => {
    const pwa = readSource("components/pwa/PwaProvider.tsx");
    expect(pwa).toContain("ROVEXO_SW_SCRIPT");
    expect(pwa).toContain("ROVEXO_SW_SCOPE");
    expect(pwa).toContain("localhost");
    expect(readSource("lib/pwa/pwa-update-engine-v1.ts")).toContain('"/sw.js"');
    expect(readSource("lib/pwa/pwa-update-engine-v1.ts")).toContain('ROVEXO_SW_SCOPE = "/"');
  });

  it("notificationclick opens absolute same-origin URL for iOS PWA", () => {
    const sw = readSource("public/sw.js");
    expect(sw).toContain("absoluteHref");
    expect(sw).toContain("new URL(href, self.location.origin)");
    expect(sw).toContain("openWindow(absoluteHref)");
  });

  it("server VAPID requires public env names only (no hardcoded secrets)", () => {
    const vapid = readSource("lib/push/vapid.ts");
    expect(vapid).toContain("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    expect(vapid).toContain("VAPID_PRIVATE_KEY");
    expect(vapid).toContain("VAPID_SUBJECT");
    expect(vapid).not.toMatch(/-----BEGIN/);
  });
});
