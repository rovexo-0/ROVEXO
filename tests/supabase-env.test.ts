import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseConfigured,
  normalizeSupabaseUrl,
  tryGetSupabaseUrl,
} from "@/lib/supabase/env";

describe("normalizeSupabaseUrl", () => {
  it("returns the origin for a valid Supabase URL", () => {
    expect(normalizeSupabaseUrl("https://pklotmwxtnnepaitedic.supabase.co")).toBe(
      "https://pklotmwxtnnepaitedic.supabase.co",
    );
  });

  it("adds https when the protocol is omitted", () => {
    expect(normalizeSupabaseUrl("pklotmwxtnnepaitedic.supabase.co")).toBe(
      "https://pklotmwxtnnepaitedic.supabase.co",
    );
  });

  it("trims surrounding whitespace from env values", () => {
    expect(normalizeSupabaseUrl("  https://pklotmwxtnnepaitedic.supabase.co  ")).toBe(
      "https://pklotmwxtnnepaitedic.supabase.co",
    );
  });

  it("corrects the common extra-n hostname typo", () => {
    expect(normalizeSupabaseUrl("https://pklotmwxtnnnepaitedic.supabase.co")).toBe(
      "https://pklotmwxtnnepaitedic.supabase.co",
    );
  });

  it("A — accepts verified local API http://127.0.0.1:54321", () => {
    expect(normalizeSupabaseUrl("http://127.0.0.1:54321")).toBe("http://127.0.0.1:54321");
  });

  it("B — accepts verified local API http://localhost:54321", () => {
    expect(normalizeSupabaseUrl("http://localhost:54321")).toBe("http://localhost:54321");
  });

  it("C — accepts valid https://<project>.supabase.co", () => {
    expect(normalizeSupabaseUrl("https://exampleproject.supabase.co")).toBe(
      "https://exampleproject.supabase.co",
    );
  });

  it("D — rejects arbitrary external host", () => {
    expect(() => normalizeSupabaseUrl("https://invalid-host.test")).toThrow(/supabase\.co/);
  });

  it("E — rejects arbitrary HTTP external URL", () => {
    expect(() => normalizeSupabaseUrl("http://evil.example.com")).toThrow(/supabase\.co/);
    expect(() => normalizeSupabaseUrl("http://evil.example.com:54321")).toThrow(/supabase\.co/);
  });

  it("F — rejects malformed URL", () => {
    expect(() => normalizeSupabaseUrl("not a url :::")).toThrow(/not a valid URL/);
  });

  it("rejects non-supabase hostnames", () => {
    expect(() => normalizeSupabaseUrl("https://invalid-host.test")).toThrow(/supabase\.co/);
  });

  it("rejects database pooler URLs", () => {
    expect(() =>
      normalizeSupabaseUrl(
        "https://aws-1-eu-west-2.pooler.supabase.com",
      ),
    ).toThrow(/pooler/);
  });

  it("rejects URLs with paths", () => {
    expect(() =>
      normalizeSupabaseUrl("https://pklotmwxtnnepaitedic.supabase.co/rest/v1"),
    ).toThrow(/origin only/);
  });

  it("rejects local Postgres port and HTTPS loopback", () => {
    expect(() => normalizeSupabaseUrl("http://127.0.0.1:54322")).toThrow(/local Supabase URL/);
    expect(() => normalizeSupabaseUrl("https://127.0.0.1:54321")).toThrow(/local Supabase URL/);
    expect(() => normalizeSupabaseUrl("http://localhost")).toThrow(/local Supabase URL/);
  });

  it("rejects http cloud supabase.co (HTTPS required)", () => {
    expect(() => normalizeSupabaseUrl("http://pklotmwxtnnepaitedic.supabase.co")).toThrow(
      /https/,
    );
  });
});

describe("Supabase env resolution", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_SUPABASE_URL over SUPABASE_URL for universal client/server access", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    vi.stubEnv("SUPABASE_URL", "https://wrong.supabase.co");
    expect(getSupabaseUrl()).toBe("https://pklotmwxtnnepaitedic.supabase.co");
  });

  it("non-production: verified local SUPABASE_URL wins over shell cloud NEXT_PUBLIC_SUPABASE_URL", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "cloud_anon_should_not_win");
    vi.stubEnv("SUPABASE_ANON_KEY", "local_anon_key_for_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "cloud_service_should_not_win");
    vi.stubEnv("SERVICE_ROLE_KEY", "local_service_role_key_for_test");
    expect(getSupabaseUrl()).toBe("http://127.0.0.1:54321");
    expect(getSupabaseAnonKey()).toBe("local_anon_key_for_test");
    expect(getSupabaseServiceRoleKey()).toBe("local_service_role_key_for_test");
  });

  it("requires an explicit Supabase URL when URL env vars are unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_URL", "");
    expect(() => getSupabaseUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("accepts SUPABASE_URL as a server-side alias", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    expect(getSupabaseUrl()).toBe("https://pklotmwxtnnepaitedic.supabase.co");
  });

  it("accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", () => {
    vi.stubEnv("SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_ANON_KEY", "");
    vi.stubEnv("ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    expect(getSupabaseAnonKey()).toBe("sb_publishable_test");
  });

  it("I — getSupabaseUrl returns local URL for local E2E env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    expect(getSupabaseUrl()).toBe("http://127.0.0.1:54321");
  });

  it("H — local URL does not silently fall back to Production", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    const resolved = getSupabaseUrl();
    expect(resolved).toBe("http://127.0.0.1:54321");
    expect(resolved).not.toContain("pklotmwxtnnepaitedic");
    expect(resolved).not.toContain("supabase.co");
  });

  it("J — tryGetSupabaseUrl returns the local URL", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    expect(tryGetSupabaseUrl()).toBe("http://localhost:54321");
  });

  it("K — isSupabaseConfigured is true for verified local URL + anon key", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "local_anon_key_for_test");
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("tryGetSupabaseUrl returns null for invalid local forms (no production fallback)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54322");
    vi.stubEnv("SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    // Prefer public var; invalid local must not fall through to SUPABASE_URL production.
    expect(tryGetSupabaseUrl()).toBeNull();
  });
});
