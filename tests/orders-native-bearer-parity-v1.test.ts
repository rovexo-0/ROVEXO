/**
 * PATCH/GET /api/orders/[id] cookie+Bearer parity for Native Everything OK / I Have an Issue.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

describe("PATCH /api/orders/[id] Native Bearer parity", () => {
  const route = () => read("app/api/orders/[id]/route.ts");

  it("uses requireCookieOrBearerApiAuth for GET and PATCH", () => {
    const src = route();
    expect(src).toContain('from "@/lib/auth/require-cookie-or-bearer-api-auth-v1"');
    expect(src).toContain("requireCookieOrBearerApiAuth(request)");
    expect(src.match(/requireCookieOrBearerApiAuth\(request\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(src).not.toContain("requireApiAuth");
    expect(src).not.toContain("requireAuthContext");
  });

  it("preserves confirm_ok and report_issue order actions", () => {
    const src = route();
    expect(src).toContain("report_issue");
    expect(src).toContain("applyOrderAction");
    expect(src).toContain("canPerformOrderAction");
    expect(src).toContain("body.action");
  });
});
