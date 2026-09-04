/**
 * GET/POST /api/shipping/labels cookie+Bearer parity for Native Print Label.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

describe("/api/shipping/labels Native Bearer parity", () => {
  const route = () => read("app/api/shipping/labels/route.ts");

  it("uses requireCookieOrBearerApiAuth for GET and POST", () => {
    const src = route();
    expect(src).toContain('from "@/lib/auth/require-cookie-or-bearer-api-auth-v1"');
    expect(src).toContain("requireCookieOrBearerApiAuth(request)");
    expect(src.match(/requireCookieOrBearerApiAuth\(request\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(src).not.toContain("requireApiAuth");
  });

  it("preserves label generation contract", () => {
    const src = route();
    expect(src).toContain("generateShippingLabelForOrder");
    expect(src).toContain("assertOrderShippingSeller");
    expect(src).toContain("orderId");
  });
});
