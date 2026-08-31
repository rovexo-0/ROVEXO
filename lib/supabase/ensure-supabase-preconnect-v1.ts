"use client";

/**
 * OPT-HP-PERF — Supabase preconnect only when the browser is about to talk to Supabase.
 * Root layout no longer global-preconnects (guest Homepage LCP does not hit this origin).
 */
export function ensureSupabasePreconnect(origin: string): void {
  if (typeof document === "undefined" || !origin) return;
  if (document.querySelector('link[data-rovexo-supabase-preconnect="1"]')) return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = origin;
  link.crossOrigin = "anonymous";
  link.setAttribute("data-rovexo-supabase-preconnect", "1");
  document.head.appendChild(link);
}
