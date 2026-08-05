import { describe, expect, it } from "vitest";
import { AuthApiError, AuthSessionMissingError } from "@supabase/supabase-js";
import { isInvalidOrExpiredRefreshError } from "@/lib/auth/invalid-refresh-session";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("invalid refresh session recovery", () => {
  it("detects refresh_token_not_found AuthApiError", () => {
    const error = new AuthApiError("Invalid Refresh Token: Refresh Token Not Found", 400, "refresh_token_not_found");
    expect(isInvalidOrExpiredRefreshError(error)).toBe(true);
  });

  it("detects related session codes and AuthSessionMissingError", () => {
    expect(
      isInvalidOrExpiredRefreshError(
        new AuthApiError("already used", 400, "refresh_token_already_used"),
      ),
    ).toBe(true);
    expect(isInvalidOrExpiredRefreshError(new AuthSessionMissingError())).toBe(true);
  });

  it("does not treat unrelated errors as invalid refresh", () => {
    expect(isInvalidOrExpiredRefreshError(new AuthApiError("nope", 400, "invalid_credentials"))).toBe(
      false,
    );
    expect(isInvalidOrExpiredRefreshError(new Error("network down"))).toBe(false);
    expect(isInvalidOrExpiredRefreshError(null)).toBe(false);
  });

  it("wires recovery into guest redirect and middleware", () => {
    const root = process.cwd();
    const guest = readFileSync(join(root, "lib/auth/guest-redirect.ts"), "utf8");
    const middleware = readFileSync(join(root, "lib/supabase/middleware.ts"), "utf8");
    expect(guest).toContain("isInvalidOrExpiredRefreshError");
    expect(guest).toContain('signOut({ scope: "local" })');
    expect(middleware).toContain("isInvalidOrExpiredRefreshError");
    expect(middleware).toContain('signOut({ scope: "local" })');
  });
});
