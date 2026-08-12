/**
 * COD SÂNGE — CSRF origin / production appUrl identity.
 * No live HTTP. No Sendcloud.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { validateMutationOrigin } from "@/lib/api/csrf-guard";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("COD SÂNGE CSRF production origin", () => {
  it("getAppUrl production ignores localhost from env", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3000");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");

    const { getAppUrl, DEFAULT_APP_URL } = await import("@/lib/supabase/env");
    expect(DEFAULT_APP_URL).toBe("https://www.rovexo.co.uk");
    expect(getAppUrl()).toBe("https://www.rovexo.co.uk");
  });

  it("production CSRF allows www.rovexo.co.uk Origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");

    expect(
      validateMutationOrigin(
        new Request("https://www.rovexo.co.uk/api/shipping/labels", {
          method: "POST",
          headers: { origin: "https://www.rovexo.co.uk" },
        }),
      ),
    ).toBeNull();
  });

  it("production CSRF rejects evil Origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");

    const blocked = validateMutationOrigin(
      new Request("https://www.rovexo.co.uk/api/shipping/labels", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
    );
    expect(blocked?.status).toBe(403);
  });

  it("production CSRF ignores misconfigured loopback APP_URL allowlist entry", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    const blocked = validateMutationOrigin(
      new Request("https://www.rovexo.co.uk/api/shipping/labels", {
        method: "POST",
        headers: {
          host: "www.rovexo.co.uk",
          origin: "http://localhost:3000",
        },
      }),
    );
    expect(blocked?.status).toBe(403);

    expect(
      validateMutationOrigin(
        new Request("https://www.rovexo.co.uk/api/shipping/labels", {
          method: "POST",
          headers: {
            host: "www.rovexo.co.uk",
            origin: "https://www.rovexo.co.uk",
          },
        }),
      ),
    ).toBeNull();
  });

  it("development still allows localhost Origin", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    expect(
      validateMutationOrigin(
        new Request("http://localhost:3000/api/shipping/labels", {
          method: "POST",
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).toBeNull();
  });
});
