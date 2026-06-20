import { describe, expect, it } from "vitest";
import { normalizeSupabaseUrl } from "@/lib/supabase/env";

describe("normalizeSupabaseUrl", () => {
  it("returns the origin for a valid Supabase URL", () => {
    expect(normalizeSupabaseUrl("https://pklotmwxtnnepaitedic.supabase.co")).toBe(
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
    expect(() => normalizeSupabaseUrl("https://example.com")).toThrow(/supabase\.co/);
  });

  it("rejects URLs with paths", () => {
    expect(() =>
      normalizeSupabaseUrl("https://pklotmwxtnnepaitedic.supabase.co/rest/v1"),
    ).toThrow(/origin only/);
  });
});
