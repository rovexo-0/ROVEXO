"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types/database";
import {
  isSupabaseConfigured,
  tryGetSupabaseAnonKey,
  tryGetSupabaseUrl,
} from "@/lib/supabase/env";

export { isSupabaseConfigured };

export function createClient() {
  const url = tryGetSupabaseUrl();
  const key = tryGetSupabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient<Database>(url, key);
}

export function tryCreateClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    return createClient();
  } catch {
    return null;
  }
}
