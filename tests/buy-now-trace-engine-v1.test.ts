import { describe, expect, it } from "vitest";
import { BuyNowTraceEngine } from "@/lib/checkout/engines/buy-now-trace-engine-v1";

describe("Buy Now Trace Engine v1", () => {
  it("records PASS steps and stops on FAIL with blocking evidence", () => {
    const trace = new BuyNowTraceEngine("test_run");
    trace.start("BUY_NOW", "buy-now-engine-v1.ts", 1, "validateBuyer()");
    trace.pass("BUY_NOW", "buy-now-engine-v1.ts", 1, "validateBuyer()");
    trace.pass("validateBuyer()", "buy-now-engine-v1.ts", 10, "validateSellerNotSelf()");
    const blocking = trace.fail({
      step: "validateSelfPurchase()",
      code: "RVX-2003",
      reason: "currentUser.id === listing.owner.id (self-purchase)",
      file: "lib/checkout/engines/buy-now-engine-v1.ts",
      line: 194,
      next: null,
      rootCause: "current user owns this listing",
    });
    expect(blocking.functionName).toBe("validateSelfPurchase()");
    expect(blocking.lineNumber).toBe(194);
    expect(blocking.realFailureReason).toContain("listing.owner.id");
    expect(trace.getBlockingFailure()?.rootCause).toContain("owns this listing");
    // After FAIL, further steps are ignored
    trace.pass("createCheckout()", "buy-now-engine-v1.ts", 200, null);
    expect(trace.getSteps().some((s) => s.step === "createCheckout()")).toBe(false);
  });
});
