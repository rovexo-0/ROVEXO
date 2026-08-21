import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  preserveAuthorizationHeader,
  readBearerAccessToken,
  requestHasSupabaseAuthCookie,
} from "@/lib/auth/verify-bearer-access-token-v1";

const root = process.cwd();
const read = (relative: string) => readFileSync(join(root, relative), "utf8");

describe("verifyBearerAccessToken helpers", () => {
  it("reads Bearer tokens and ignores missing/invalid prefixes", () => {
    expect(
      readBearerAccessToken(
        new Request("https://www.rovexo.co.uk/api/saved", {
          headers: { authorization: "Bearer native-access-token" },
        }),
      ),
    ).toBe("native-access-token");
    expect(readBearerAccessToken(new Request("https://www.rovexo.co.uk/api/saved"))).toBeNull();
    expect(
      readBearerAccessToken(
        new Request("https://www.rovexo.co.uk/api/saved", {
          headers: { authorization: "Basic abc" },
        }),
      ),
    ).toBeNull();
  });

  it("detects Supabase auth cookies without treating Native as cookie-auth", () => {
    expect(
      requestHasSupabaseAuthCookie(
        new Request("https://www.rovexo.co.uk/api/saved", {
          headers: { cookie: "sb-pklotmwxtnnepaitedic-auth-token.0=abc" },
        }),
      ),
    ).toBe(true);
    expect(
      requestHasSupabaseAuthCookie(new Request("https://www.rovexo.co.uk/api/saved")),
    ).toBe(false);
  });

  it("preserves Authorization onto middleware override headers", () => {
    const from = new Headers({ authorization: "Bearer native-access-token" });
    const to = new Headers();
    preserveAuthorizationHeader(from, to);
    expect(to.get("authorization")).toBe("Bearer native-access-token");
  });
});

describe("canonical bearer auth singularity", () => {
  it("listings upload, listings create, and saved share one Bearer verifier", () => {
    const auth = read("lib/saved/saved-api-auth-v1.ts");
    const verify = read("lib/auth/verify-bearer-access-token-v1.ts");
    const middleware = read("lib/supabase/middleware.ts");
    const upload = read("app/api/listings/upload/route.ts");
    const listings = read("app/api/listings/route.ts");
    const saved = read("app/api/saved/route.ts");
    expect(verify).toContain("supabase.auth.getUser(accessToken)");
    expect(verify).not.toContain("jwt.decode");
    expect(auth).toContain("verifyBearerAccessToken");
    expect(auth).toContain("requireApiAuth");
    expect(middleware).toContain("verifyBearerAccessToken");
    expect(middleware).toContain("preserveAuthorizationHeader");
    expect(middleware).toContain("stripIncomingVerifiedUserHeader");
    expect(middleware).toContain("readBearerAccessToken");
    expect(upload).toContain("requireCookieOrBearerListingRole");
    expect(listings).toContain("requireCookieOrBearerListingRole");
    expect(saved).toContain("requireSavedApiAuth");
    expect(saved).not.toContain("requireCookieOrBearerListingRole");
  });
});
