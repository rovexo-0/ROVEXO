"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types/database";
import {
  isSupabaseConfigured,
  tryGetSupabaseAnonKey,
  tryGetSupabaseUrl,
} from "@/lib/supabase/env";
import { ensureSupabasePreconnect } from "@/lib/supabase/ensure-supabase-preconnect-v1";

export { isSupabaseConfigured };

export function createClient() {
  const url = tryGetSupabaseUrl();
  const key = tryGetSupabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  try {
    ensureSupabasePreconnect(new URL(url).origin);
  } catch {
    /* ignore invalid URL — createBrowserClient will surface config errors */
  }

  return createBrowserClient<Database>(url, key);
}

export function tryCreateClient() {
  if (!isSupabaseConfigured()) {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-supabase-client", "UNCONFIGURED");
    }
    return null;
  }

  try {
    const client = createClient();
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-supabase-client", "OK");
    }
    return client;
  } catch {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-supabase-client", "THROW");
    }
    return null;
  }
}
