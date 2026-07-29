import { describe, expect, it } from "vitest";
import { resolvePushPermissionAction } from "@/lib/push/client-subscribe";

describe("push permission gate (iOS gesture law)", () => {
  it("never prompts when allowPrompt is false and permission is default", () => {
    expect(resolvePushPermissionAction("default", false)).toBe("abort");
  });

  it("prompts only when allowPrompt is true and permission is default", () => {
    expect(resolvePushPermissionAction("default", true)).toBe("request");
  });

  it("subscribes when already granted without prompting", () => {
    expect(resolvePushPermissionAction("granted", false)).toBe("subscribe");
    expect(resolvePushPermissionAction("granted", true)).toBe("subscribe");
  });

  it("aborts when denied or unsupported", () => {
    expect(resolvePushPermissionAction("denied", true)).toBe("abort");
    expect(resolvePushPermissionAction("unsupported", true)).toBe("abort");
  });
});
