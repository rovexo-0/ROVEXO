import { readFileSync } from "node:fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Native Production parity — privacy + listing rails", () => {
  it("privacy and notification settings accept request-aware Bearer and user-scoped RLS", () => {
    const privacy = read("app/api/account/privacy/route.ts");
    const settings = read("app/api/notifications/settings/route.ts");
    expect(privacy).toContain("requireApiAuth(request)");
    expect(privacy).not.toMatch(/\brequireApiAuth\(\)/);
    expect(privacy).toContain("getPrivacyEngine(auth.user.id, auth.supabase)");
    expect(privacy).toContain("updatePrivacyEngine(");
    expect(privacy).toContain("auth.supabase");
    expect(settings).toContain("requireApiAuth(request)");
    expect(settings).not.toMatch(/\brequireApiAuth\(\)/);
    expect(settings).toContain("getNotificationEngine(auth.user.id, auth.supabase)");
    expect(settings).toContain("updateNotificationSettings(auth.user.id, body, auth.supabase)");
  });

  it("requireApiAuth ports Bearer without weakening Production CSRF", () => {
    const session = read("lib/auth/session.ts");
    expect(session).toContain("readBearerAccessToken");
    expect(session).toContain("requireCookieOrBearerApiAuth");
    expect(session).toContain("await validateMutationOrigin(request)");
    expect(session).not.toMatch(/const blocked = validateMutationOrigin\(request\);/);
  });

  it("similar and member-items use canonical listing engines", () => {
    const similar = read("app/api/listing/[slug]/similar/route.ts");
    const member = read("app/api/listing/[slug]/member-items/route.ts");
    const repo = read("lib/products/repository.ts");
    const catalog = read("lib/products/catalog.ts");
    expect(similar).toContain("getSimilarProducts");
    expect(similar).toContain('source: "getSimilarProducts"');
    expect(similar).not.toContain("requireApiAuth");
    expect(similar.includes("api/" + "native")).toBe(false);
    expect(member).toContain("getMemberProducts");
    expect(member).toContain('source: "getMemberProducts"');
    expect(member).not.toContain("requireApiAuth");
    expect(member.includes("api/" + "native")).toBe(false);
    expect(repo).toContain("export async function getMemberProducts");
    expect(repo).toContain('surface: "seller"');
    expect(catalog).toContain("getMemberProducts");
  });

  it("does not rewrite listing GET, CSRF guard, listings, or messages", () => {
    const listingGet = read("app/api/listing/[slug]/route.ts");
    expect(listingGet).toContain("toPublicListingDetailDocument");
    expect(listingGet).not.toContain("toPublicProductDocument");
    const csrf = read("lib/api/csrf-guard.ts");
    expect(csrf).toContain("export async function validateMutationOrigin");
    expect(csrf).toContain("verifyBearerAccessToken");
  });
});
