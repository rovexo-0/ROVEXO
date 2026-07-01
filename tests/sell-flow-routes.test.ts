import { describe, expect, it } from "vitest";
import { isSellFlowRoute } from "@/lib/navigation/sell-flow-routes";

describe("sell flow routes", () => {
  it("matches the sell listing form route", () => {
    expect(isSellFlowRoute("/sell")).toBe(true);
    expect(isSellFlowRoute("/sell/new")).toBe(true);
    expect(isSellFlowRoute("/sell/camera")).toBe(true);
    expect(isSellFlowRoute("/seller/listings/abc123/edit")).toBe(true);
  });

  it("does not match unrelated marketplace routes", () => {
    expect(isSellFlowRoute("/")).toBe(false);
    expect(isSellFlowRoute("/seller/listings")).toBe(false);
    expect(isSellFlowRoute("/seller/listings/abc123")).toBe(false);
    expect(isSellFlowRoute("/help")).toBe(false);
  });
});
