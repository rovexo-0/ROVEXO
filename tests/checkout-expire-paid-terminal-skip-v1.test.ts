import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isCheckoutExpireTerminalSkip } from "@/lib/checkout/engines/checkout-session-engine-v1";

describe("checkout session expireAll — paid terminal skip", () => {
  it("classifies paid destroy reasons as expected terminal skips", () => {
    expect(isCheckoutExpireTerminalSkip("paid")).toBe(true);
    expect(isCheckoutExpireTerminalSkip("paid_post_claim")).toBe(true);
    expect(isCheckoutExpireTerminalSkip("expire_not_persisted")).toBe(false);
    expect(isCheckoutExpireTerminalSkip("claim_error:x")).toBe(false);
    expect(isCheckoutExpireTerminalSkip("race_lost:expired")).toBe(false);
    expect(isCheckoutExpireTerminalSkip("expired")).toBe(false);
  });

  it("expireAll must not count paid skips as failures", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/checkout/engines/checkout-session-engine-v1.ts"),
      "utf8",
    );
    expect(source).toContain("isCheckoutExpireTerminalSkip(result.reason)");
    expect(source).toContain("isCheckoutExpireTerminalSkip(destroyed.reason)");
    expect(source).toContain(
      "// Paid / payment race — expected terminal. Do not expire, restore, or fail.",
    );
  });
});
