import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_SUPABASE_URL over SUPABASE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    vi.stubEnv("SUPABASE_URL", "https://wrong.supabase.co");
    expect(getSupabaseUrl()).toBe("https://pklotmwxtnnepaitedic.supabase.co");
  });

  it("reports configured state when canonical public keys are present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://pklotmwxtnnepaitedic.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_test");
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("reports unconfigured state when public keys are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    expect(getSupabaseAnonKey()).toBe("sb_publishable_test");
  });
});
