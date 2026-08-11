/**
 * SENDCLOUD_STEP2_ERROR_VISIBILITY_FIX — ConversationHub must surface API error body.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ConversationHub shipping label error visibility", () => {
  it("surfaces POST /api/shipping/labels JSON error instead of always using the generic toast", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");

    expect(hub).toContain('fetch("/api/shipping/labels"');
    expect(hub).toContain('method: "POST"');
    expect(hub).toContain("body: JSON.stringify({ orderId: order.id })");
    expect(hub).toContain('let toastTitle = "Unable to get shipping label."');
    expect(hub).toContain("failure.error");
    expect(hub).toContain("toastTitle = apiError");
    expect(hub).toContain("pushToast({ title: toastTitle, variant: \"error\" })");
  });
});
