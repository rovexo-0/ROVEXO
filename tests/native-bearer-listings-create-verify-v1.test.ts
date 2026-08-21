import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Native Bearer listings create verify — A–H", () => {
  it("A. Cookie/Web create keeps session RLS and sellerId from auth.user.id", () => {
    const route = readSource("app/api/listings/route.ts");
    const post = route.slice(route.indexOf("export async function POST"));
    expect(post).toContain("sellerId: auth.user.id");
    expect(post).not.toContain("body.sellerId");
    expect(post).not.toContain("body.seller_id");

    const profile = readSource("lib/account/profile-completion.server.ts");
    expect(profile).toContain("if (user?.id === userId)");
    expect(profile).toContain("return session");
    expect(profile).toContain("if (user)");
    expect(profile).toContain("PROFILE_COMPLETION_SESSION_REQUIRED");
  });

  it("B. Native Bearer without cookies can complete profile gate + create + load", () => {
    const profile = readSource("lib/account/profile-completion.server.ts");
    expect(profile).toContain("tryCreateAdminClient");
    expect(profile).toContain("eq(\"user_id\", userId)");
    expect(profile).toContain("eq(\"seller_id\", userId)");

    const repo = readSource("lib/listings/repository.ts");
    const create = repo.slice(
      repo.indexOf("export async function createSellerListing"),
      repo.indexOf("\nexport async function updateSellerListing"),
    );
    expect(create).toContain("listingMutationClient()");
    expect(create).toContain("insertProductImages");
    expect(create).toContain("getSellerListingById(input.sellerId, product.id)");

    const load = repo.slice(
      repo.indexOf("export async function getSellerListingById"),
      repo.indexOf("\nexport async function createSellerListing"),
    );
    expect(load).toContain("listingMutationClient()");
    expect(load).toContain("user?.id === ownerId");
  });

  it("C. Invalid Bearer stays 401 via requireCookieOrBearerListingRole", () => {
    const auth = readSource("lib/saved/saved-api-auth-v1.ts");
    expect(auth).toContain("verifyBearerAccessToken(token)");
    expect(auth).toContain('return unauthorized()');
    expect(auth).toContain('{ error: "Unauthorized" }');
    expect(auth).toContain("status: 401");
    expect(readSource("lib/auth/verify-bearer-access-token-v1.ts")).toContain(
      "supabase.auth.getUser(accessToken)",
    );
    expect(readSource("lib/auth/verify-bearer-access-token-v1.ts")).not.toContain("jwtDecode");
    expect(readSource("lib/auth/verify-bearer-access-token-v1.ts")).not.toContain("atob(");
  });

  it("D. Missing listing role stays 403", () => {
    const auth = readSource("lib/saved/saved-api-auth-v1.ts");
    expect(auth).toContain("requireCookieOrBearerListingRole");
    expect(auth).toContain("LISTING_ROLES");
    expect(auth).toContain('{ error: "Forbidden" }');
    expect(auth).toContain("status: 403");
  });

  it("E. User A cannot create as User B — sellerId is auth.user.id only", () => {
    const schema = readSource("lib/sell/listing-api-schema.ts");
    expect(schema).not.toMatch(/sellerId/);
    expect(schema).not.toMatch(/seller_id/);
    const post = readSource("app/api/listings/route.ts").slice(
      readSource("app/api/listings/route.ts").indexOf("export async function POST"),
    );
    expect(post).toContain("sellerId: auth.user.id");
    const auth = readSource("lib/saved/saved-api-auth-v1.ts");
    expect(auth.indexOf("readBearerAccessToken")).toBeLessThan(auth.indexOf("stampedUserFromMiddleware"));
  });

  it("F. Incomplete first publish uses 428 bank gate, not 500", () => {
    const post = readSource("app/api/listings/route.ts").slice(
      readSource("app/api/listings/route.ts").indexOf("export async function POST"),
    );
    expect(post).toContain("resolveProfileCompletionRedirect");
    expect(post).toContain('"publish"');
    expect(post).toContain("Add your bank account in Settings before publishing your first listing.");
    expect(post).toContain("status: 428");
    expect(post.indexOf("resolveProfileCompletionRedirect")).toBeLessThan(
      post.indexOf("await createSellerListing"),
    );
  });

  it("G. Post-create retrieval with Bearer uses listingMutationClient when cookie user is absent", () => {
    const repo = readSource("lib/listings/repository.ts");
    const load = repo.slice(
      repo.indexOf("export async function getSellerListingById"),
      repo.indexOf("\nexport async function createSellerListing"),
    );
    expect(load).toContain("await createClient()");
    expect(load).toContain("listingMutationClient()");
    expect(load).toContain('.eq("seller_id", ownerId)');
  });

  it("H. Image ownership prefix remains fail-closed", () => {
    const repo = readSource("lib/listings/repository.ts");
    const move = repo.slice(
      repo.indexOf("async function moveImageToProductFolder"),
      repo.indexOf("\nasync function insertProductImages"),
    );
    expect(move).toContain("startsWith(`${sellerId}/`)");
    expect(move).toContain('throw new Error("Invalid image storage path.")');
    const upload = readSource("app/api/listings/upload/route.ts");
    expect(upload).toContain("buildTempImagePath(auth.user.id");
    expect(upload).toContain("buildProductImagePath(auth.user.id");
  });
});

describe("Native Bearer create path — createClient() classification", () => {
  it("does not require a remaining cookie-only mutation that can 500 Native create", () => {
    const profile = readSource("lib/account/profile-completion.server.ts");
    expect(profile).toContain("tryCreateAdminClient");
    expect(profile).toContain("user?.id === userId");

    const repo = readSource("lib/listings/repository.ts");
    const create = repo.slice(
      repo.indexOf("export async function createSellerListing"),
      repo.indexOf("\nexport async function updateSellerListing"),
    );
    expect(create).toContain("listingMutationClient()");
    expect(create).not.toContain("await createClient()");

    const load = repo.slice(
      repo.indexOf("export async function getSellerListingById"),
      repo.indexOf("\nexport async function createSellerListing"),
    );
    expect(load).toContain("user?.id === ownerId ? session : await listingMutationClient()");
  });

  it("cookie CSRF remains on requireApiAuth; Bearer skips Origin CSRF", () => {
    const session = readSource("lib/auth/session.ts");
    expect(session).toContain("validateMutationOrigin(request)");
    const saved = readSource("lib/saved/saved-api-auth-v1.ts");
    expect(saved).toContain("if (token)");
    expect(saved).toContain("return requireApiAuth(request)");
    const csrf = readSource("lib/api/csrf-guard.ts");
    expect(csrf).toContain("Native OkHttp");
    expect(csrf).toContain("/^Bearer\\s+\\S+/i");
  });
});
