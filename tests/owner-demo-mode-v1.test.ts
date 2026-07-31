import { describe, expect, it } from "vitest";
import {
  OWNER_DEMO_MODE_V1,
  parseOwnerDemoModeFlag,
  shouldShowOwnerDemoInboxRows,
} from "@/lib/inbox/demo/owner-demo-mode-v1";

describe("owner-demo-mode-v1", () => {
  it("defaults Owner Demo Mode OFF", () => {
    expect(OWNER_DEMO_MODE_V1.defaultEnabled).toBe(false);
    expect(parseOwnerDemoModeFlag(undefined)).toBe(false);
    expect(parseOwnerDemoModeFlag("0")).toBe(false);
  });

  it("requires authenticated super_admin + explicit ON for Inbox demo rows", () => {
    expect(
      shouldShowOwnerDemoInboxRows({
        authenticated: true,
        role: "super_admin",
        ownerDemoModeEnabled: true,
      }),
    ).toBe(true);

    expect(
      shouldShowOwnerDemoInboxRows({
        authenticated: true,
        role: "super_admin",
        ownerDemoModeEnabled: false,
      }),
    ).toBe(false);

    expect(
      shouldShowOwnerDemoInboxRows({
        authenticated: true,
        role: "seller",
        ownerDemoModeEnabled: true,
      }),
    ).toBe(false);

    expect(
      shouldShowOwnerDemoInboxRows({
        authenticated: false,
        role: "super_admin",
        ownerDemoModeEnabled: true,
      }),
    ).toBe(false);
  });

  it("InboxPage no longer auto-merges on NODE_ENV alone", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(
      join(process.cwd(), "features/inbox/components/InboxPage.tsx"),
      "utf8",
    );
    expect(source).toContain("shouldShowOwnerDemoInboxRows");
    expect(source).not.toContain("isMessagesLifecycleDemoEnabled()");
  });
});
