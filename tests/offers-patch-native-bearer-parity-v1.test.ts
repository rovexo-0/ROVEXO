/**
 * PATCH /api/offers/[id] cookie+Bearer parity (Blood XLIII actions preserved).
 * Complements native-commerce-bearer-v1 — focused on Accept/Decline/Counter + Bundle accept engine.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

describe("PATCH /api/offers/[id] Native Bearer parity", () => {
  const route = () => read("app/api/offers/[id]/route.ts");
  const createRoute = () => read("app/api/offers/route.ts");
  const hub = () => read("features/inbox/components/ConversationHub.tsx");

  it("uses the same requireCookieOrBearerApiAuth helper as POST /api/offers", () => {
    expect(createRoute()).toContain("requireCookieOrBearerApiAuth(request)");
    expect(route()).toContain("requireCookieOrBearerApiAuth(request)");
    expect(route()).toContain("if (auth instanceof NextResponse) return auth");
    expect(route()).toContain("const { user, supabase } = auth");
    expect(route()).not.toContain("requireAuthContext");
  });

  it("rejects unauthorized via auth NextResponse (no AuthError throw path)", () => {
    expect(route()).not.toContain("throw new AuthError");
    expect(route()).not.toContain("await requireAuthContext()");
  });

  it("preserves Accept Decline Counter cancel contract and expectedStatus", () => {
    expect(route()).toContain('action: z.enum(["accept", "decline", "counter", "cancel"])');
    expect(route()).toContain("expectedStatus");
    expect(hub()).toContain('expectedStatus: "pending"');
    expect(route()).toContain('parsed.data.action === "accept"');
    expect(route()).toContain('parsed.data.action === "decline"');
    expect(route()).toContain('parsed.data.action === "counter"');
    expect(route()).toContain("resolveOfferFromRole");
    expect(route()).toContain("executeCounterOffer");
  });

  it("preserves Bundle ACCEPT → BUNDLE_BUY_NOW_ENGINE before status accepted", () => {
    const src = route();
    const buyIdx = src.indexOf("BUNDLE_BUY_NOW_ENGINE");
    const acceptUpdateIdx = src.indexOf('.update({ status: "accepted" })');
    expect(buyIdx).toBeGreaterThan(0);
    expect(acceptUpdateIdx).toBeGreaterThan(buyIdx);
    expect(src).toContain("parseBundleMessageMeta");
  });

  it("does not redesign Individual create-offer auth (POST remains cookie+Bearer)", () => {
    expect(createRoute()).toContain("requireCookieOrBearerApiAuth(request)");
    expect(createRoute()).toContain("createBundleOffer");
  });
});
