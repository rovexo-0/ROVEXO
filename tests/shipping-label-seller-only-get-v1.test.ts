import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Shipping Label GET — seller-only authorization", () => {
  it("locks GET /api/shipping/labels behind assertOrderShippingSeller", () => {
    const labels = readSource("app/api/shipping/labels/route.ts");
    const assert = readSource("lib/shipping/assert-order-shipping-access.server.ts");

    expect(assert).toContain("export async function assertOrderShippingSeller");
    expect(assert).toMatch(/access\.role !== "seller"/);
    expect(labels).toContain("assertOrderShippingSeller");
    expect(labels).not.toContain("assertOrderShippingParticipant");
    expect(labels).toContain('status: 404');
    expect(labels).toContain("Shipping record not found.");
  });

  it("preserves POST seller ownership via generateShippingLabelForOrder", () => {
    const labels = readSource("app/api/shipping/labels/route.ts");
    expect(labels).toContain("generateShippingLabelForOrder");
    expect(labels).toContain("auth.user.id");
  });

  it("keeps participant gate on non-label shipping reads", () => {
    expect(readSource("app/api/shipping/route.ts")).toContain("assertOrderShippingParticipant");
    expect(readSource("app/api/shipping/quotes/route.ts")).toContain(
      "assertOrderShippingParticipant",
    );
  });
});
