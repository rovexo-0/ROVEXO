import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

describe.skipIf(!hasSupabaseEnv)("supabase integration", () => {
  it(
    "connects to Supabase auth",
    async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(supabaseUrl!, supabaseAnonKey!);
      const { data, error } = await client.auth.getSession();
      expect(error).toBeNull();
      expect(data.session).toBeNull();
    },
    15_000,
  );

  it(
    "reads public categories after migrations",
    async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(supabaseUrl!, supabaseAnonKey!);
      const { data, error } = await client.from("categories").select("slug").limit(1);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    },
    15_000,
  );
});

describe("session persistence contract", () => {
  it("uses SSR cookie helpers for server and browser clients", async () => {
    const server = await import("@/lib/supabase/server");
    const browser = await import("@/lib/supabase/client");
    expect(server.createClient).toBeTypeOf("function");
    expect(browser.createClient).toBeTypeOf("function");
  });
});
