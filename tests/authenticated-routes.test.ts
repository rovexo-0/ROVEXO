import { describe, expect, it } from "vitest";
import { isAuthenticatedAppRoute } from "@/lib/navigation/authenticated-routes";

describe("authenticated app routes", () => {
  it("hides the public footer on authenticated prefixes", () => {
    expect(isAuthenticatedAppRoute("/buyer")).toBe(true);
    expect(isAuthenticatedAppRoute("/seller")).toBe(true);
    expect(isAuthenticatedAppRoute("/seller/listings")).toBe(true);
    expect(isAuthenticatedAppRoute("/sell")).toBe(true);
    expect(isAuthenticatedAppRoute("/business/dashboard")).toBe(true);
    expect(isAuthenticatedAppRoute("/account/settings")).toBe(true);
    expect(isAuthenticatedAppRoute("/admin/orders")).toBe(true);
    expect(isAuthenticatedAppRoute("/super-admin")).toBe(true);
  });

  it("keeps the public footer on marketplace routes", () => {
    expect(isAuthenticatedAppRoute("/")).toBe(false);
    expect(isAuthenticatedAppRoute("/search")).toBe(false);
    expect(isAuthenticatedAppRoute("/listing/example")).toBe(false);
    expect(isAuthenticatedAppRoute("/help")).toBe(false);
  });
});
