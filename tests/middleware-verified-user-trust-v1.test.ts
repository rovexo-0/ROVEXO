import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  encodeMiddlewareVerifiedUser,
  readMiddlewareVerifiedUserState,
  ROVEXO_VERIFIED_USER_HEADER,
  stripIncomingVerifiedUserHeader,
} from "@/lib/auth/middleware-verified-user-v1";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const STAMP_SECRET = "test-internal-stamp-secret";

function forgeUnsignedStamp(id: string, email = "spoof@evil.test"): string {
  const json = JSON.stringify({ id, email, emailConfirmedAt: null });
  return Buffer.from(json).toString("base64url");
}

describe("middleware verified-user trust boundary", () => {
  beforeEach(() => {
    vi.stubEnv("INTERNAL_REQUEST_STAMP_SECRET", STAMP_SECRET);
  });

  it("strips a client-supplied trust header before the server writes its own", () => {
    const headers = new Headers({
      [ROVEXO_VERIFIED_USER_HEADER]: forgeUnsignedStamp(USER_B),
      authorization: "Bearer native-access-token",
    });
    stripIncomingVerifiedUserHeader(headers);
    expect(headers.get(ROVEXO_VERIFIED_USER_HEADER)).toBeNull();
    expect(headers.get("authorization")).toBe("Bearer native-access-token");
  });

  it("rejects unsigned client-forged stamps", async () => {
    const state = await readMiddlewareVerifiedUserState(
      new Headers({ [ROVEXO_VERIFIED_USER_HEADER]: forgeUnsignedStamp(USER_B) }),
    );
    expect(state.kind).not.toBe("user");
  });

  it("rejects a stamp signed for a different secret", async () => {
    const trusted = await encodeMiddlewareVerifiedUser({
      id: USER_B,
      email: "b@rovexo.co.uk",
    });
    expect(trusted).toContain(".");
    vi.stubEnv("INTERNAL_REQUEST_STAMP_SECRET", "other-internal-stamp-secret");
    const state = await readMiddlewareVerifiedUserState(
      new Headers({ [ROVEXO_VERIFIED_USER_HEADER]: trusted }),
    );
    expect(state.kind).not.toBe("user");
  });

  it("accepts only a server HMAC stamp after encode", async () => {
    const trusted = await encodeMiddlewareVerifiedUser({
      id: USER_A,
      email: "a@rovexo.co.uk",
      email_confirmed_at: "2026-01-01T00:00:00Z",
    });
    const state = await readMiddlewareVerifiedUserState(
      new Headers({ [ROVEXO_VERIFIED_USER_HEADER]: trusted }),
    );
    expect(state.kind).toBe("user");
    if (state.kind !== "user") return;
    expect(state.user.id).toBe(USER_A);
    expect(state.user.email).toBe("a@rovexo.co.uk");
  });

  it("treats empty middleware stamp as anonymous, not a user", async () => {
    const state = await readMiddlewareVerifiedUserState(
      new Headers({ [ROVEXO_VERIFIED_USER_HEADER]: "" }),
    );
    expect(state.kind).toBe("anonymous");
  });

  it("does not mint a user stamp without a server secret", async () => {
    vi.stubEnv("INTERNAL_REQUEST_STAMP_SECRET", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const trusted = await encodeMiddlewareVerifiedUser({
      id: USER_A,
      email: "a@rovexo.co.uk",
    });
    expect(trusted).toBe("");
  });
});
