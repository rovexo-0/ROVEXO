import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  normalizeSupabaseUrl,
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

  it("requires an explicit Supabase URL when URL env vars are unset", () => {
    expect(() => getSupabaseUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("accepts SUPABASE_URL as a server-side alias", () => {
    vi.stubEnv("SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    expect(getSupabaseUrl()).toBe("https://pklotmwxtnnepaitedic.supabase.co");
  });

  it("accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    expect(getSupabaseAnonKey()).toBe("sb_publishable_test");
  });
});
