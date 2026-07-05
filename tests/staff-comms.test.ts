import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateStaffAttachment } from "@/lib/staff-comms/files";
import { STAFF_WEBRTC_ICE_SERVERS } from "@/lib/staff-comms/webrtc-client";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Staff Communications Platform", () => {
  it("validates attachment mime types and size limits", () => {
    expect(validateStaffAttachment("image/png", 1024).ok).toBe(true);
    expect(validateStaffAttachment("application/x-msdownload", 1024).ok).toBe(false);
    expect(validateStaffAttachment("image/png", 30 * 1024 * 1024).ok).toBe(false);
  });

  it("ships WebRTC ICE servers for peer connections", () => {
    expect(STAFF_WEBRTC_ICE_SERVERS.length).toBeGreaterThan(0);
    expect(STAFF_WEBRTC_ICE_SERVERS[0]?.urls).toBeTruthy();
  });

  it("ships production API routes for comms", () => {
    expect(readSource("app/api/staff-enterprise/messages/route.ts")).toContain("sendStaffMessageEnhanced");
    expect(readSource("app/api/staff-enterprise/calls/route.ts")).toContain("initiateStaffCall");
    expect(readSource("app/api/staff-enterprise/files/route.ts")).toContain("attachStaffMessageFile");
    expect(readSource("app/api/staff-enterprise/offline/route.ts")).toContain("syncStaffOfflineQueue");
    expect(readSource("app/api/staff-enterprise/push/route.ts")).toContain("registerStaffDevice");
  });

  it("ships native staff shell project", () => {
    expect(readSource("apps/rovexo-staff/capacitor.config.ts")).toContain("co.uk.rovexo.staff");
    expect(readSource("apps/rovexo-staff/package.json")).toContain("build:android:apk");
  });

  it("enables voice and video in enterprise descriptor", () => {
    const descriptor = readSource("lib/staff-enterprise/descriptor.ts");
    expect(descriptor).toContain('defaultEnabled: true');
    expect(descriptor).not.toMatch(/staff_voice_enabled[\s\S]*defaultEnabled: false/);
    expect(descriptor).not.toMatch(/staff_video_enabled[\s\S]*defaultEnabled: false/);
  });
});
