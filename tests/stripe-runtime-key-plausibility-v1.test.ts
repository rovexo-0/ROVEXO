import { describe, expect, it } from "vitest";
import { isStripeLiveKey, isStripeTestKey } from "@/lib/stripe/runtime-mode-v1";

describe("stripe runtime key plausibility", () => {
  it("rejects prefix-only TEST stubs", () => {
    expect(isStripeTestKey("sk_test_...")).toBe(false);
    expect(isStripeTestKey("pk_test_...")).toBe(false);
    expect(isStripeTestKey("sk_test_short")).toBe(false);
    expect(isStripeTestKey("")).toBe(false);
    expect(isStripeTestKey(null)).toBe(false);
  });

  it("rejects prefix-only LIVE stubs", () => {
    expect(isStripeLiveKey("sk_live_...")).toBe(false);
    expect(isStripeLiveKey("pk_live_short")).toBe(false);
  });

  it("accepts plausible long TEST keys", () => {
    const sk = `sk_test_${"a".repeat(90)}`;
    const pk = `pk_test_${"b".repeat(90)}`;
    expect(isStripeTestKey(sk)).toBe(true);
    expect(isStripeTestKey(pk)).toBe(true);
    expect(isStripeLiveKey(sk)).toBe(false);
  });
});
